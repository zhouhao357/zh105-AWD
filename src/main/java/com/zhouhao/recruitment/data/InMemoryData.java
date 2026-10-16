package com.zhouhao.recruitment.data;

import com.zhouhao.recruitment.model.Job;
import com.zhouhao.recruitment.model.Resume;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.Map;

/**
 * 内存临时数据源
 */
@Component
public class InMemoryData {

    private final Map<Long, Job> jobStore = new ConcurrentHashMap<>();
    private final Map<Long, Resume> resumeStore = new ConcurrentHashMap<>();
    private final AtomicLong resumeIdGenerator = new AtomicLong(1);

    public InMemoryData() {
        // 初始化职位数据
        jobStore.put(1L, new Job(1L, "Java高级开发工程师", "阿里巴巴", "杭州", "25K-45K",
                "负责核心电商平台的Java后端开发，参与高并发系统设计与优化。",
                "5年以上Java开发经验，精通Spring Boot/Cloud，熟悉MySQL、Redis、Kafka等中间件。"));
        jobStore.put(2L, new Job(2L, "前端开发工程师", "字节跳动", "北京", "20K-35K",
                "负责公司核心产品的前端开发，使用React/Vue技术栈。",
                "3年以上前端开发经验，精通HTML/CSS/JavaScript，熟悉React或Vue框架。"));
        jobStore.put(3L, new Job(3L, "Python开发工程师", "腾讯", "深圳", "18K-30K",
                "负责后端服务开发与数据处理，参与AI相关项目落地。",
                "3年以上Python开发经验，熟悉Django/Flask，了解机器学习框架者优先。"));
        jobStore.put(4L, new Job(4L, "测试工程师", "美团", "上海", "12K-20K",
                "负责产品质量保障，编写和执行测试用例，跟踪缺陷。",
                "2年以上测试经验，熟悉自动化测试工具Selenium/Appium，了解接口测试。"));
        jobStore.put(5L, new Job(5L, "运维开发工程师", "京东", "大连", "15K-25K",
                "负责运维平台开发与维护，保障系统稳定性。",
                "3年以上运维经验，熟悉Linux/Docker/K8s，掌握Shell/Python脚本开发。"));
    }

    // ==================== Job 操作 ====================

    public Optional<Job> findJobById(Long id) {
        return Optional.ofNullable(jobStore.get(id));
    }

    // ==================== Resume 操作 ====================

    public Optional<Resume> findResumeById(Long id) {
        return Optional.ofNullable(resumeStore.get(id));
    }

    public Resume saveResume(Resume resume) {
        Long id = resumeIdGenerator.getAndIncrement();
        resume.setId(id);
        resumeStore.put(id, resume);
        return resume;
    }

    public Resume updateResume(Long id, Resume updated) {
        Resume existing = resumeStore.get(id);
        if (existing == null) {
            return null;
        }
        updated.setId(id);
        // 保留原有的userId不变
        updated.setUserId(existing.getUserId());
        resumeStore.put(id, updated);
        return updated;
    }

    public List<Resume> findAllResumes() {
        return new ArrayList<>(resumeStore.values());
    }
}
