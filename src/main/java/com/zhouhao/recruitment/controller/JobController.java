package com.zhouhao.recruitment.controller;

import com.zhouhao.recruitment.common.BusinessException;
import com.zhouhao.recruitment.common.Result;
import com.zhouhao.recruitment.data.InMemoryData;
import com.zhouhao.recruitment.model.Job;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

/**
 * 任务01：查询职位详情
 * GET /jobs/{id}
 */
@RestController
@RequestMapping("/jobs")
public class JobController {

    private final InMemoryData dataStore;

    public JobController(InMemoryData dataStore) {
        this.dataStore = dataStore;
    }

    /**
     * 根据职位编号返回职位详细信息
     * 职位不存在时返回404错误信息
     */
    @GetMapping("/{id}")
    public Result<Job> getJobById(@PathVariable Long id) {
        Optional<Job> job = dataStore.findJobById(id);
        if (job.isEmpty()) {
            throw new BusinessException(404, "职位不存在，编号：" + id);
        }
        return Result.success("查询职位详情成功", job.get());
    }
}
