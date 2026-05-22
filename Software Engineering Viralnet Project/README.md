# Software Engineering: ViralNet Project

## Overview
This repository contains the source code, documentation, and deployment configurations for the **ViralNet Project**, a predictive, geospatial agent-based SEIR simulation. 

Designed for pre-emptive urban health management, ViralNet shifts public health models from reactive to proactive by predicting and visualizing the "Exposed" population state. This gives city officials atleast 5–7 days time to implement lockdowns, mask mandates and many more measures before a greater healthcare crisis occurs.

## Project Structure
- `/backend`: Core simulation engine and API services.
- `/frontend`: User interface for control of simulation and data visualization.

# Project Team
This document outlines the roles and responsibilities of the team members for the Viralnet Project.

## Team Members

| Name | Role | Responsibilities |
| :--- | :--- | :--- |
| [Ivo Sarzdoski Teovski] | **Software Lead** | Backend & SEIR Engine |
| [Ognen Popovski] | **Scrum Master** | CI/CD & Server Reliability|
| [Matej Dobrevski] | **Product Owner** | User Strategy & UX |
| [Konstantin Pandilovski] | **Frontend/UI Lead** | Map Visualization |
| [Iva Dabeska] | **QA Engineer** | Testing & Data Transparency |

*Last Updated: May 2026*

## DevOps Lifecycle
This project utilizes **Azure DevOps** to manage the full software development lifecycle:
- **Boards**: Agile project management using User Stories, Tasks, and Test Cases.
- **Repos**: Version control for all source code.
- **Pipelines**: Automated CI/CD workflows for building and verifying code on every push.
- **Wiki**: Project documentation including strategy, QA, and architecture.

## CI/CD Pipeline
The project uses **Azure Pipeline** for Continuous Integration. Every push to the `main` branch triggers an automated build process to ensure the integrity of both frontend and backend components.

## Quality Assurance
We employ a **Work-Item Based Testing Strategy**. All test cases are documented as Work Items in Azure Boards and linked to User Stories to maintain full traceability.

## Documentation
For detailed project documentation, architectural decisions, and testing strategies, please visit our [Project Wiki](https://ivosardzovski.visualstudio.com/Software-Engineering-Viralnet-Project/_wiki).
