package com.season.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class UserAddressListResponse {
    private List<UserAddressResponse> records;
}