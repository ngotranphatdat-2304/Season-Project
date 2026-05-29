package com.season.app.config;

import com.season.app.model.User;
import com.season.app.repository.UserRepository;
import com.season.app.util.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                Claims claims = jwtUtil.validateAccessToken(token);
                
                if ("access".equals(claims.get("tokenType"))) {
                    String userId = claims.getSubject();

                    // Đồng bộ với Node.js: Truy vấn Database để kiểm tra trạng thái hoạt động thực tế
                    Optional<User> userOpt = userRepository.findById(userId);
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        if ("active".equals(user.getStatus()) && Boolean.TRUE.equals(user.getIsActive())) {
                            String role = user.getRole();
                            SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role.toUpperCase());
                            
                            UsernamePasswordAuthenticationToken authentication = 
                                    new UsernamePasswordAuthenticationToken(userId, null, Collections.singletonList(authority));
                            
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        }
                    }
                }
            } catch (Exception e) {
                // Token không hợp lệ hoặc hết hạn -> Không kích hoạt Authentication Context
            }
        }

        filterChain.doFilter(request, response);
    }
}