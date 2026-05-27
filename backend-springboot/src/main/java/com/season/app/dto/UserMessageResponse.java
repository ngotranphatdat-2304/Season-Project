package com.season.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor // Tạo constructor chứa message
public class UserMessageResponse {
    private String message;
}