package it.polito.pedibus.backend.configurations;

import it.polito.pedibus.backend.components.JwtTokenProvider;
import it.polito.pedibus.backend.services.MyUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@EnableWebSecurity
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

    final private MyUserDetailsService userDetailsService;
    final private JwtTokenProvider jwtTokenProvider;

    @Bean
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }

    public WebSecurityConfig(MyUserDetailsService userDetailsService, JwtTokenProvider jwtTokenProvider) {
        this.userDetailsService = userDetailsService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
                .csrf().disable()
                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
                    .authorizeRequests()
                    .antMatchers("/lines/adminlinea/summary").hasAnyRole("ADMIN", "ADMIN_MASTER")
                    .antMatchers("/", "/index", "/register",
                            "/confirm/**", "/recover/**", "/login", "/lines/**", "/ws/**", "/user/**").permitAll()
                    .antMatchers("/availability/accompagnatore/**",
                            "/reservations/presenze/**", "/turni/accompagnatore/confermaturno").hasRole("ACCOMPAGNATORE")
                    .antMatchers("/availability/adminlinea/**", "/turni/new", "/turni/edit", "/turni/delete/**", "/turni/summary/**")
                        .hasAnyRole("ADMIN", "ADMIN_MASTER")
                    //.antMatchers("/users/**").hasRole("ADMIN")
                    .antMatchers("/users/**").hasRole("ADMIN_MASTER")
                    .antMatchers("/addbambini", "/profile", "/profile/update").hasRole("PASSEGGERO")
                    .anyRequest().authenticated()
                .and()
                    .apply(new JwtConfigurer(jwtTokenProvider));
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(userDetailsService).passwordEncoder(encoder());
    }

    @Bean
    public PasswordEncoder encoder() {
        return new BCryptPasswordEncoder();
    }
}