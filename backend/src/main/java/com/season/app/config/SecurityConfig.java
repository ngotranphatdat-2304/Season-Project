package com.season.app.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Tắt CSRF vì chúng ta dùng JWT (stateless)
            .csrf(csrf -> csrf.disable())
            
            // Kích hoạt CORS
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // Tắt Session của Spring vì ta dùng JWT
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // Cấu hình phân quyền các endpoint (Dịch từ logic của Express)
            .authorizeHttpRequests(auth -> auth
                // Các API public (ai cũng gọi được)
                .requestMatchers("/", "/api", "/api/auth/login", "/api/auth/register", "/api/auth/refresh-token").permitAll()
                .requestMatchers("/api/auth/admin/login", "/api/auth/admin/register").permitAll()
                .requestMatchers(
                    "/api/products", "/api/products/**", 
                    "/api/categories", "/api/categories/**", 
                    "/api/collections", "/api/collections/**",
                    "/api/cart", "/api/cart/**",          // Cho phép truy cập giỏ hàng tự do
                    "/api/checkout", "/api/checkout/**"   // Cho phép truy cập cổng thanh toán tự do
                ).permitAll()
                
                // Các API của Admin (Yêu cầu vai trò ADMIN)
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                
                // Bất kỳ API nào khác đều yêu cầu phải có Token hợp lệ
                .anyRequest().authenticated()
            )
            
            // Đưa JwtFilter của chúng ta vào trước Filter kiểm tra của Spring
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Cấu hình CORS để Next.js có thể gọi được
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        configuration.setAllowedOrigins(origins);
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "x-requested-with"));
        configuration.setAllowCredentials(true); // Cho phép gửi Cookie (Guest Session)

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
        public PasswordEncoder passwordEncoder() {
        // Sử dụng thuật toán BCrypt cực kỳ phổ biến và bảo mật để băm mật khẩu
        return new BCryptPasswordEncoder(12);
    }
}