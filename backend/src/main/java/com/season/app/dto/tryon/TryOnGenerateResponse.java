package com.season.app.dto.tryon;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TryOnGenerateResponse {
    private String imageBase64;
    private String mimeType;
    private String message;
}
