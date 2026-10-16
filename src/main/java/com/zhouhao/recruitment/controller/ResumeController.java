package com.zhouhao.recruitment.controller;

import com.zhouhao.recruitment.common.BusinessException;
import com.zhouhao.recruitment.common.Result;
import com.zhouhao.recruitment.data.InMemoryData;
import com.zhouhao.recruitment.model.Resume;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * 简历控制器
 *
 * 任务02：创建完整简历 POST /resumes
 * 任务03：创建简历字段校验 POST /resumes（@Valid校验）
 * 任务04：查询简历详情 GET /resumes/{id}
 * 任务05：查询不存在的简历 GET /resumes/{id}
 * 任务06：修改简历基本信息 PUT /resumes/{id}
 * 任务07：修改简历求职信息 PUT /resumes/{id}
 */
@RestController
@RequestMapping("/resumes")
public class ResumeController {

    private final InMemoryData dataStore;

    public ResumeController(InMemoryData dataStore) {
        this.dataStore = dataStore;
    }

    /**
     * 任务02 & 任务03：创建完整简历（含字段校验）
     * POST /resumes
     *
     * @Valid 触发 Resume 中的校验注解，
     * 校验失败时由 GlobalExceptionHandler 捕获并返回400错误
     */
    @PostMapping
    public Result<Resume> createResume(@Valid @RequestBody Resume resume) {
        Resume saved = dataStore.saveResume(resume);
        return Result.success("简历创建成功", saved);
    }

    /**
     * 任务04 & 任务05：查询简历详情
     * GET /resumes/{id}
     *
     * 简历不存在时返回404，不返回错误的简历数据
     */
    @GetMapping("/{id}")
    public Result<Resume> getResumeById(@PathVariable Long id) {
        Optional<Resume> resume = dataStore.findResumeById(id);
        if (resume.isEmpty()) {
            throw new BusinessException(404, "简历不存在，编号：" + id);
        }
        return Result.success("查询简历详情成功", resume.get());
    }

    /**
     * 任务06：修改简历基本信息
     * 任务07：修改简历求职信息
     * PUT /resumes/{id}
     *
     * 支持修改姓名、电话、邮箱、城市等基本信息（任务06）
     * 支持修改学历、经验、期望薪资、技能、自我介绍等求职信息（任务07）
     * 采用部分更新策略，仅更新请求体中包含的字段
     */
    @PutMapping("/{id}")
    public Result<Resume> updateResume(@PathVariable Long id, @RequestBody Resume updateRequest) {
        Optional<Resume> existing = dataStore.findResumeById(id);
        if (existing.isEmpty()) {
            throw new BusinessException(404, "简历不存在，编号：" + id);
        }

        Resume resume = existing.get();

        // 任务06：更新基本信息字段
        if (updateRequest.getRealName() != null) {
            resume.setRealName(updateRequest.getRealName());
        }
        if (updateRequest.getPhone() != null) {
            resume.setPhone(updateRequest.getPhone());
        }
        if (updateRequest.getEmail() != null) {
            resume.setEmail(updateRequest.getEmail());
        }
        if (updateRequest.getCity() != null) {
            resume.setCity(updateRequest.getCity());
        }
        if (updateRequest.getGender() != null) {
            resume.setGender(updateRequest.getGender());
        }
        if (updateRequest.getAvatar() != null) {
            resume.setAvatar(updateRequest.getAvatar());
        }

        // 任务07：更新求职信息字段
        if (updateRequest.getEducation() != null) {
            resume.setEducation(updateRequest.getEducation());
        }
        if (updateRequest.getExperience() != null) {
            resume.setExperience(updateRequest.getExperience());
        }
        if (updateRequest.getExpectedSalary() != null) {
            resume.setExpectedSalary(updateRequest.getExpectedSalary());
        }
        if (updateRequest.getSkills() != null) {
            resume.setSkills(updateRequest.getSkills());
        }
        if (updateRequest.getIntroduction() != null) {
            resume.setIntroduction(updateRequest.getIntroduction());
        }

        return Result.success("简历更新成功", resume);
    }
}
