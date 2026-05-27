package com.season.app.service;

import com.season.app.exception.UserServiceException;
import com.season.app.model.User;
import com.season.app.model.UserAddress;
import com.season.app.repository.UserRepository;
// import com.season.app.repository.OrderRepository;
// import com.season.app.repository.RefreshTokenRepository;
import com.season.app.dto.*; // Import các class DTO (sẽ hướng dẫn tạo sau)

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    // TODO: Sẽ cần tạo OrderRepository và RefreshTokenRepository sau này
    // @Autowired
    // private OrderRepository orderRepository;
    
    // @Autowired
    // private RefreshTokenRepository refreshTokenRepository;

    /**
     * Hàm Helper: Tìm user và kiểm tra trạng thái hoạt động
     * Tương đương: requireUser(userId) trong file TS
     */
    private User requireUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserServiceException(HttpStatus.NOT_FOUND, "User not found"));

        if (!"active".equals(user.getStatus()) || Boolean.FALSE.equals(user.getIsActive())) {
            throw new UserServiceException(HttpStatus.NOT_FOUND, "User not found");
        }
        return user;
    }

    /**
     * Hàm Helper: Tìm địa chỉ cụ thể của một user
     * Tương đương: findAddress(user, addressId)
     */
    private UserAddress findAddress(User user, String addressId) {
        return user.getAddresses().stream()
                .filter(a -> a.getId().equals(addressId))
                .findFirst()
                .orElseThrow(() -> new UserServiceException(HttpStatus.NOT_FOUND, "Address not found"));
    }

    /**
     * Hàm Helper: Xoá cờ mặc định của tất cả địa chỉ
     * Tương đương: clearDefaultAddresses(user)
     */
    private void clearDefaultAddresses(User user) {
        user.getAddresses().forEach(a -> a.setIsDefault(false));
    }

    // ==========================================
    // CÁC HÀM NGHIỆP VỤ CHÍNH (PUBLIC METHODS)
    // ==========================================

    public UserProfileResponse getUserProfile(String userId) {
        User user = requireUser(userId);
        return new UserProfileResponse(user); // Map từ Entity sang DTO để trả về
    }

    public UserProfileResponse updateUserProfile(String userId, UserProfileUpdateInput input) {
        User user = requireUser(userId);

        if (input.getName() != null) user.setName(input.getName());
        if (input.getPhone() != null) user.setPhone(input.getPhone());
        if (input.getAvatar() != null) user.setAvatar(input.getAvatar());

        userRepository.save(user); // Lưu vào MongoDB
        return new UserProfileResponse(user);
    }

    public UserMessageResponse changeUserPassword(String userId, ChangePasswordInput input) {
        User user = requireUser(userId);

        // Kiểm tra mật khẩu cũ (Tương đương user.matchPassword)
        if (!passwordEncoder.matches(input.getCurrentPassword(), user.getPassword())) {
            throw new UserServiceException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }

        // Mã hoá mật khẩu mới và lưu lại
        user.setPassword(passwordEncoder.encode(input.getNewPassword()));
        userRepository.save(user);

        // Xoá tất cả refresh token để bắt đăng nhập lại trên các thiết bị
        // refreshTokenRepository.deleteAllByUserId(user.getId());

        return new UserMessageResponse("Password changed");
    }

    public UserProfileResponse addUserAddress(String userId, UserAddressInput input) {
        User user = requireUser(userId);
        
        boolean isDefault = Boolean.TRUE.equals(input.getIsDefault()) || user.getAddresses().isEmpty();

        if (isDefault) {
            clearDefaultAddresses(user);
        }

        UserAddress newAddress = UserAddress.builder()
                .label(input.getLabel())
                .address(input.getAddress())
                .isDefault(isDefault)
                .build();

        user.getAddresses().add(newAddress);
        userRepository.save(user);
        
        return new UserProfileResponse(user);
    }

    public List<UserAddress> listUserAddresses(String userId) {
        User user = requireUser(userId);
        return user.getAddresses();
    }

    public UserProfileResponse setDefaultUserAddress(String userId, String addressId) {
        User user = requireUser(userId);
        UserAddress address = findAddress(user, addressId);

        clearDefaultAddresses(user);
        address.setIsDefault(true);
        
        userRepository.save(user);
        return new UserProfileResponse(user);
    }

    public UserProfileResponse updateUserAddress(String userId, String addressId, UserAddressUpdateInput input) {
        User user = requireUser(userId);
        UserAddress address = findAddress(user, addressId);

        if (input.getLabel() != null) address.setLabel(input.getLabel());
        if (input.getAddress() != null) address.setAddress(input.getAddress());

        if (Boolean.TRUE.equals(input.getIsDefault())) {
            clearDefaultAddresses(user);
            address.setIsDefault(true);
        } else if (Boolean.FALSE.equals(input.getIsDefault())) {
            address.setIsDefault(false);
        }

        userRepository.save(user);
        return new UserProfileResponse(user);
    }

    public UserProfileResponse deleteUserAddress(String userId, String addressId) {
        User user = requireUser(userId);
        
        // Tìm địa chỉ cần xoá
        Optional<UserAddress> addressToRemove = user.getAddresses().stream()
                .filter(a -> a.getId().equals(addressId))
                .findFirst();

        if (addressToRemove.isEmpty()) {
            throw new UserServiceException(HttpStatus.NOT_FOUND, "Address not found");
        }

        UserAddress removedAddress = addressToRemove.get();
        user.getAddresses().remove(removedAddress);

        // Nếu xoá địa chỉ mặc định, tự động gán địa chỉ đầu tiên còn lại thành mặc định
        if (Boolean.TRUE.equals(removedAddress.getIsDefault()) && !user.getAddresses().isEmpty()) {
            boolean hasDefault = user.getAddresses().stream().anyMatch(a -> Boolean.TRUE.equals(a.getIsDefault()));
            if (!hasDefault) {
                user.getAddresses().get(0).setIsDefault(true);
            }
        }

        userRepository.save(user);
        return new UserProfileResponse(user);
    }

    public UserMessageResponse deactivateCurrentUser(String userId) {
        // Kiểm tra xem có order nào đang pending không
        // boolean hasPendingOrder = orderRepository.existsByUserIdAndStatusIn(userId, List.of("pending"));
        // if (hasPendingOrder) {
        //     throw new UserServiceException(HttpStatus.CONFLICT, "Pending orders must finish before deleting the account");
        // }

        User user = requireUser(userId);
        user.setIsActive(false);
        user.setStatus("banned"); // Theo nguyên bản Node.js, status chuyển thành banned
        
        userRepository.save(user);
        
        // refreshTokenRepository.deleteAllByUserId(user.getId());

        return new UserMessageResponse("Tai khoan da duoc xoa (vo hieu hoa)");
    }
}