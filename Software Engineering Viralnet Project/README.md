# Software Engineering: ViralNet Project

## Overview
This repository contains the source code, documentation, and development artifacts for the **ViralNet Project**, a simulation tool designed for geospatial analysis and analytics.

## Project Structure
- `/backend`: Core simulation engine and API services.
- `/frontend`: User interface for simulation control and data visualization.

## DevOps Lifecycle
This project utilizes **Azure DevOps** to manage the full software development lifecycle:
- **Boards**: Agile project management using User Stories, Tasks, and Test Cases.
- **Repos**: Version control for all source code.
- **Pipelines**: Automated CI/CD workflows for building and verifying code on every push.
- **Wiki**: Project documentation including strategy, QA, and architecture.

## CI/CD Pipeline
The project uses **Azure Pipelines** for Continuous Integration. Every push to the `main` branch triggers an automated build process to ensure the integrity of both frontend and backend components.

## Quality Assurance
We employ a **Work-Item Based Testing Strategy**. All test cases are documented as Work Items in Azure Boards and linked to User Stories to maintain full traceability.

## Documentation
For detailed project documentation, architectural decisions, and testing strategies, please visit our [Project Wiki](https://ivosardzovski.visualstudio.com/Software-Engineering-Viralnet-Project/_wiki).