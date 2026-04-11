Feature: Solution Discovery
  As a developer
  I want the tool to automatically find all project files in my directory
  So that I can open them without navigating the file system manually

  Background:
    Given I am running as an administrator
    And at least one IDE is configured

  Scenario: Discover Visual Studio solution file
    Given the current directory contains "MyApp.sln"
    When solution discovery runs
    Then "MyApp.sln" should appear in the solutions list
    And its IDE type should be "Visual Studio"
    And its executable should be "devenv.exe"

  Scenario: Discover Visual Studio 2022 solution file
    Given the current directory contains "MyApp.slnx"
    When solution discovery runs
    Then "MyApp.slnx" should appear in the solutions list
    And its IDE type should be "Visual Studio 2022"
    And its executable should be "devenv.exe"

  Scenario: Discover JetBrains Rider project file
    Given the current directory contains "MyApp.iml"
    When solution discovery runs
    Then "MyApp.iml" should appear in the solutions list
    And its IDE type should be "JetBrains Rider"
    And its executable should be "rider.exe"

  Scenario: Discover IntelliJ IDEA project directory
    Given the current directory contains "MyApp.idea"
    When solution discovery runs
    Then "MyApp.idea" should appear in the solutions list
    And its IDE type should be "JetBrains IntelliJ IDEA"
    And its executable should be "idea.exe"

  Scenario: Recursive discovery in subdirectories
    Given the current directory has a subdirectory "src" containing "Backend.sln"
    When solution discovery runs
    Then "Backend.sln" should appear in the solutions list

  Scenario: No project files found
    Given the current directory contains no supported project files
    When solution discovery runs
    Then the solutions list should be empty
    And I should see an error message "There are no solutions to open"

  Scenario: Skip directories listed in .sln-openerignore
    Given a ".sln-openerignore" file exists with pattern "node_modules"
    And the "node_modules" directory contains "SomePackage.sln"
    When solution discovery runs
    Then "SomePackage.sln" should not appear in the solutions list

  Scenario: Skip multiple patterns from .sln-openerignore
    Given a ".sln-openerignore" file exists with patterns:
      | pattern       |
      | node_modules  |
      | build         |
      | dist          |
      | .git          |
    When solution discovery runs
    Then none of those directories should be searched

  Scenario: Ignore comments in .sln-openerignore
    Given a ".sln-openerignore" file contains:
      """
      # This is a comment
      node_modules
      # Another comment
      build
      """
    When solution discovery runs
    Then "node_modules" and "build" should be skipped
    And comment lines should not be treated as patterns

  Scenario: No .sln-openerignore file present
    Given no ".sln-openerignore" file exists in the current directory
    When solution discovery runs
    Then all subdirectories should be searched

  Scenario: Mixed IDE project types in same directory
    Given the current directory contains:
      | file          | ide                   |
      | WebApp.sln    | Visual Studio         |
      | MobileApp.iml | JetBrains Rider       |
    When solution discovery runs
    Then both files should appear in the solutions list
    And each should have the correct IDE type assigned

  Scenario: Case-insensitive file extension matching
    Given the current directory contains "MyApp.SLN"
    When solution discovery runs
    Then "MyApp.SLN" should appear in the solutions list
    And its IDE type should be "Visual Studio"
