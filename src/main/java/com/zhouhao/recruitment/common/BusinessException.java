package com.zhouhao.recruitment.common;

/**
 * 自定义业务异常
 */
public class BusinessException extends RuntimeException {

    private final int code;

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public BusinessException(String message) {
        this(404, message);
    }

    public int getCode() {
        return code;
    }
}
