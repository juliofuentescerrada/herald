## ADDED Requirements

### Requirement: CI builds Herald's images when their inputs change
CI SHALL build the four images, without pushing them, whenever code or the image definitions change, and SHALL fail the pull request when an image does not build or does not meet its requirements.

#### Scenario: A change to an image definition builds the images
- **WHEN** a pull request changes a file under `deploy/images/`
- **THEN** CI's changed-file classification selects the images job
