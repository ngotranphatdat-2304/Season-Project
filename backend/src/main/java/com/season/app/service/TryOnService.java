package com.season.app.service;

import com.alibaba.dashscope.aigc.multimodalconversation.MultiModalConversation;
import com.alibaba.dashscope.aigc.multimodalconversation.MultiModalConversationParam;
import com.alibaba.dashscope.aigc.multimodalconversation.MultiModalConversationResult;
import com.alibaba.dashscope.common.MultiModalMessage;
import com.alibaba.dashscope.common.Role;
import com.alibaba.dashscope.exception.ApiException;
import com.alibaba.dashscope.exception.NoApiKeyException;
import com.alibaba.dashscope.exception.UploadFileException;
import com.alibaba.dashscope.utils.Constants;
import com.season.app.dto.tryon.TryOnGenerateResponse;
import com.season.app.model.Product;
import com.season.app.repository.ProductRepository;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TryOnService {
    private static final String DEFAULT_FACE_MIME_TYPE = "image/jpeg";
    private static final String DEFAULT_RESULT_MIME_TYPE = "image/png";
    private static final String COMPRESSED_RESULT_MIME_TYPE = "image/jpeg";
    private static final long MAX_FACE_IMAGE_BYTES = 4L * 1024L * 1024L;
    private static final int MAX_RESULT_IMAGE_WIDTH = 768;
    private static final float RESULT_JPEG_QUALITY = 0.88f;
    private static final String RATE_LIMIT_MESSAGE = "Try-on limit reached. Please try again later.";
    private static final String TRY_ON_PROMPT = """
            Use Image 3 as the base customer photo. Do not recreate the photo. Only add the glasses from Image 1 and Image 2 onto the customer's face.
            Keep the same framing, camera angle, face, skin texture, lighting, background, expression, hair, and clothing from Image 3.
            Place the glasses naturally with correct scale, perspective, bridge position, lens alignment, and temple arm direction.
            Preserve the glasses exactly: frame shape, frame color, transparent or glossy material texture, lens tint, lens opacity, reflections, bridge, hinges, screws, nose pads, temple arms, and end tips.
            Do not zoom, crop, beautify, stylize, repaint, relight, smooth skin, change face shape, change hair, change camera angle, regenerate the person, add text, add watermark, add accessories, or duplicate the glasses.            """;

    private final ProductRepository productRepository;
    private final HttpClient httpClient;
    private final String dashscopeApiKey;
    private final String dashscopeBaseUrl;
    private final String qwenImageModel;
    private final boolean qwenImageWatermark;
    private final int qwenImageCount;
    private final Bucket globalBucket;
    private final ConcurrentHashMap<String, Bucket> ipBuckets = new ConcurrentHashMap<>();
    private final int ipLimitPerHour;

    public TryOnService(
            ProductRepository productRepository,
            @Value("${DASHSCOPE_API_KEY:}") String dashscopeApiKey,
            @Value("${DASHSCOPE_BASE_URL:https://ws-r0m8w99r3jiepdm2.ap-southeast-1.maas.aliyuncs.com/api/v1}") String dashscopeBaseUrl,
            @Value("${QWEN_IMAGE_MODEL:qwen-image-edit-plus}") String qwenImageModel,
            @Value("${QWEN_IMAGE_WATERMARK:false}") boolean qwenImageWatermark,
            @Value("${QWEN_IMAGE_COUNT:1}") int qwenImageCount,
            @Value("${TRY_ON_GLOBAL_LIMIT_PER_HOUR:10}") int globalLimitPerHour,
            @Value("${TRY_ON_IP_LIMIT_PER_HOUR:3}") int ipLimitPerHour
    ) {
        this.productRepository = productRepository;
        this.dashscopeApiKey = dashscopeApiKey;
        this.dashscopeBaseUrl = dashscopeBaseUrl;
        this.qwenImageModel = qwenImageModel;
        this.qwenImageWatermark = qwenImageWatermark;
        this.qwenImageCount = Math.max(1, Math.min(qwenImageCount, 1));
        this.ipLimitPerHour = Math.max(1, ipLimitPerHour);
        this.globalBucket = createHourlyBucket(Math.max(1, globalLimitPerHour));
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public TryOnGenerateResponse generateTryOn(
            MultipartFile faceImage,
            String productId,
            String variantSku,
            String clientIp
    ) {
        if (dashscopeApiKey == null || dashscopeApiKey.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI try-on is not configured");
        }

        validateFaceImage(faceImage);

        Product.Variant variant = findVariant(productId, variantSku);
        List<String> productImageUrls = findProductReferenceImages(variant);
        consumeRateLimit(clientIp);

        try {
            String faceImageDataUrl = toDataUrl(faceImage);
            String generatedImageUrl = callQwen(productImageUrls, faceImageDataUrl);
            InlineImage generatedImage = downloadGeneratedImage(generatedImageUrl);

            return new TryOnGenerateResponse(
                    generatedImage.base64Data(),
                    generatedImage.mimeType(),
                    "Generated virtual try-on preview"
            );
        } catch (ResponseStatusException error) {
            throw error;
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI try-on request was interrupted");
        } catch (ApiException | NoApiKeyException | UploadFileException error) {
            throw mapProviderException(error);
        } catch (Exception error) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI try-on generation failed");
        }
    }

    private void validateFaceImage(MultipartFile faceImage) {
        if (faceImage == null || faceImage.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "faceImage is required");
        }

        if (faceImage.getSize() > MAX_FACE_IMAGE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "faceImage is too large");
        }
    }

    private Product.Variant findVariant(String productId, String variantSku) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        List<Product.Variant> variants =
                product.getVariants() == null ? Collections.emptyList() : product.getVariants();

        return variants.stream()
                .filter(item -> item.getSku() != null && item.getSku().equals(variantSku))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product variant not found"));
    }

    private List<String> findProductReferenceImages(Product.Variant variant) {
        List<String> variantImages =
                variant.getImages() == null ? Collections.emptyList() : variant.getImages();

        List<String> validImages = variantImages.stream()
                .filter(image -> image != null && image.trim().isEmpty() == false)
                .map(String::trim)
                .toList();

        if (validImages.size() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product variant needs first image and second-to-last image for try-on");
        }

        return Arrays.asList(validImages.get(0), validImages.get(validImages.size() - 2));
    }

    private void consumeRateLimit(String clientIp) {
        Bucket ipBucket = ipBuckets.computeIfAbsent(
                clientIp == null || clientIp.trim().isEmpty() ? "unknown" : clientIp.trim(),
                ignored -> createHourlyBucket(ipLimitPerHour)
        );

        if (ipBucket.getAvailableTokens() < 1 || globalBucket.getAvailableTokens() < 1) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, RATE_LIMIT_MESSAGE);
        }

        if (ipBucket.tryConsume(1) == false || globalBucket.tryConsume(1) == false) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, RATE_LIMIT_MESSAGE);
        }
    }

    private Bucket createHourlyBucket(int limitPerHour) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(limitPerHour)
                .refillGreedy(limitPerHour, Duration.ofHours(1))
                .build();

        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    private String toDataUrl(MultipartFile faceImage) throws IOException {
        String mimeType = normalizeMimeType(faceImage.getContentType(), DEFAULT_FACE_MIME_TYPE);
        String data = Base64.getEncoder().encodeToString(faceImage.getBytes());

        return "data:" + mimeType + ";base64," + data;
    }

    private String callQwen(List<String> productImageUrls, String faceImageDataUrl)
            throws ApiException, NoApiKeyException, UploadFileException {
        Constants.baseHttpApiUrl = normalizeBaseUrl(dashscopeBaseUrl);

        MultiModalConversation conversation = new MultiModalConversation();
        MultiModalMessage userMessage = MultiModalMessage.builder()
                .role(Role.USER.getValue())
                .content(Arrays.asList(
                        Collections.singletonMap("image", productImageUrls.get(0)),
                        Collections.singletonMap("image", productImageUrls.get(1)),
                        Collections.singletonMap("image", faceImageDataUrl),
                        Collections.singletonMap("text", TRY_ON_PROMPT)
                ))
                .build();

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("watermark", qwenImageWatermark);
        parameters.put("negative_prompt", "");
        parameters.put("prompt_extend", false);
        parameters.put("n", qwenImageCount);

        MultiModalConversationParam param = MultiModalConversationParam.builder()
                .apiKey(dashscopeApiKey.trim())
                .model(qwenImageModel.trim())
                .messages(Collections.singletonList(userMessage))
                .parameters(parameters)
                .build();

        MultiModalConversationResult result = conversation.call(param);
        String generatedImageUrl = extractGeneratedImageUrl(result);

        if (generatedImageUrl.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI try-on provider did not return an image");
        }

        return generatedImageUrl;
    }

    private String extractGeneratedImageUrl(MultiModalConversationResult result) {
        if (result == null || result.getOutput() == null || result.getOutput().getChoices() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI try-on provider did not return an image");
        }

        return result.getOutput().getChoices().stream()
                .filter(choice -> choice != null && choice.getMessage() != null && choice.getMessage().getContent() != null)
                .flatMap(choice -> choice.getMessage().getContent().stream())
                .filter(content -> content != null && content.containsKey("image"))
                .map(content -> String.valueOf(content.get("image")))
                .filter(imageUrl -> imageUrl.trim().isEmpty() == false)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI try-on provider did not return an image"));
    }

    private InlineImage downloadGeneratedImage(String imageUrl) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(imageUrl))
                .timeout(Duration.ofSeconds(30))
                .GET()
                .build();
        HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not download generated try-on image");
        }

        String originalMimeType = response.headers()
                .firstValue("content-type")
                .map(value -> value.split(";")[0].trim())
                .orElse(DEFAULT_RESULT_MIME_TYPE);
        InlineImage compressedImage = compressGeneratedImage(response.body());

        return new InlineImage(
                compressedImage.base64Data(),
                normalizeMimeType(compressedImage.mimeType(), normalizeMimeType(originalMimeType, DEFAULT_RESULT_MIME_TYPE))
        );
    }

    private InlineImage compressGeneratedImage(byte[] imageBytes) throws IOException {
        BufferedImage sourceImage = ImageIO.read(new ByteArrayInputStream(imageBytes));

        if (sourceImage == null) {
            return new InlineImage(
                    Base64.getEncoder().encodeToString(imageBytes),
                    DEFAULT_RESULT_MIME_TYPE
            );
        }

        int targetWidth = Math.min(sourceImage.getWidth(), MAX_RESULT_IMAGE_WIDTH);
        int targetHeight = Math.max(1, Math.round((float) sourceImage.getHeight() * targetWidth / sourceImage.getWidth()));
        BufferedImage targetImage = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = targetImage.createGraphics();

        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            graphics.drawImage(sourceImage, 0, 0, targetWidth, targetHeight, null);
        } finally {
            graphics.dispose();
        }

        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");

        if (writers.hasNext() == false) {
            ImageIO.write(targetImage, "jpg", output);
        } else {
            ImageWriter writer = writers.next();
            ImageWriteParam writeParam = writer.getDefaultWriteParam();

            if (writeParam.canWriteCompressed() == true) {
                writeParam.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                writeParam.setCompressionQuality(RESULT_JPEG_QUALITY);
            }

            try (ImageOutputStream imageOutputStream = ImageIO.createImageOutputStream(output)) {
                writer.setOutput(imageOutputStream);
                writer.write(null, new IIOImage(targetImage, null, null), writeParam);
            } finally {
                writer.dispose();
            }
        }

        return new InlineImage(
                Base64.getEncoder().encodeToString(output.toByteArray()),
                COMPRESSED_RESULT_MIME_TYPE
        );
    }

    private ResponseStatusException mapProviderException(Exception error) {
        String message = error.getMessage() == null ? "" : error.getMessage().toLowerCase();

        if (message.contains("api-key") || message.contains("apikey") || message.contains("unauthorized")
                || message.contains("forbidden") || message.contains("invalid api")) {
            return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI try-on is not authorized");
        }

        if (message.contains("quota") || message.contains("rate") || message.contains("limit")
                || message.contains("throttl")) {
            return new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "AI try-on quota was exceeded");
        }

        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI try-on provider returned an error");
    }

    private String normalizeMimeType(String value, String fallback) {
        if (value == null || value.trim().isEmpty()) {
            return fallback;
        }

        String normalized = value.trim().toLowerCase();

        if (normalized.equals("image/jpg")) {
            return "image/jpeg";
        }

        return normalized;
    }

    private String normalizeBaseUrl(String value) {
        if (value == null || value.trim().isEmpty()) {
            return "https://ws-r0m8w99r3jiepdm2.ap-southeast-1.maas.aliyuncs.com/api/v1";
        }

        String normalized = value.trim();

        if (normalized.endsWith("/")) {
            return normalized.substring(0, normalized.length() - 1);
        }

        return normalized;
    }

    private record InlineImage(String base64Data, String mimeType) {}
}
