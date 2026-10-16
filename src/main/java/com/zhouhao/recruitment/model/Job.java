package com.zhouhao.recruitment.model;

/**
 * 职位模型
 */
public class Job {

    private Long id;
    private String title;
    private String company;
    private String city;
    private String salary;
    private String description;
    private String requirements;

    public Job() {
    }

    public Job(Long id, String title, String company, String city, String salary,
               String description, String requirements) {
        this.id = id;
        this.title = title;
        this.company = company;
        this.city = city;
        this.salary = salary;
        this.description = description;
        this.requirements = requirements;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getSalary() { return salary; }
    public void setSalary(String salary) { this.salary = salary; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }
}
