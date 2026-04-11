Feature: CLI Entry Point
  As a developer working from the command line
  I want to run the 'os' command
  So that I can quickly open IDE projects from my current directory

  Background:
    Given I have Node.js installed
    And the sln-opener package is installed globally

  Scenario: Show version number
    When I run "os --version"
    Then the output should contain the current package version
    And the process should exit with code 0

  Scenario: Show version number with short flag
    When I run "os -v"
    Then the output should contain the current package version
    And the process should exit with code 0

  Scenario: Show help information
    When I run "os --help"
    Then the output should contain usage instructions
    And the output should list supported file types
    And the output should list available options
    And the process should exit with code 0

  Scenario: Show help information with short flag
    When I run "os -h"
    Then the output should contain usage instructions
    And the process should exit with code 0

  Scenario: Run without elevated privileges
    Given I am not running as an administrator
    When I run "os"
    Then I should see an error message about elevated permissions
    And the process should not attempt to open any solutions

  Scenario: Run with elevated privileges
    Given I am running as an administrator
    And at least one IDE is configured
    When I run "os"
    Then the tool should discover solutions in the current directory
    And present them for selection
