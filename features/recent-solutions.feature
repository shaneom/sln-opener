Feature: Recent Solutions History
  As a developer
  I want to quickly access solutions I've recently worked on
  So that I can resume my work without searching every time

  Background:
    Given I am running as an administrator
    And at least one IDE is configured

  Scenario: Display last 5 opened solutions
    Given I have previously opened 7 solutions
    When I open the menu
    Then the recent section should display only the 5 most recent solutions

  Scenario: Show time elapsed since last opened - just now
    Given I opened "MyApp.sln" less than 60 seconds ago
    When the recent solutions are displayed
    Then "MyApp.sln" should show "Just now"

  Scenario: Show time elapsed since last opened - minutes
    Given I opened "MyApp.sln" 5 minutes ago
    When the recent solutions are displayed
    Then "MyApp.sln" should show "5m ago"

  Scenario: Show time elapsed since last opened - hours
    Given I opened "MyApp.sln" 2 hours ago
    When the recent solutions are displayed
    Then "MyApp.sln" should show "2h ago"

  Scenario: Show time elapsed since last opened - days
    Given I opened "MyApp.sln" 3 days ago
    When the recent solutions are displayed
    Then "MyApp.sln" should show "3d ago"

  Scenario: Recent solution no longer in current directory
    Given "OldProject.sln" was recently opened but no longer exists in current directory
    When the recent solutions are displayed
    Then "OldProject.sln" should not appear in the recent section
    But it should remain in persistent storage

  Scenario: Recent solutions persist between sessions
    Given I opened "WebApp.sln" in a previous session
    When I start a new session and open the menu
    Then "WebApp.sln" should still appear in the recent solutions section

  Scenario: Recent solutions stored in user config
    Given I open "MyApp.sln"
    Then the recent solutions list should be updated in "~/.sln-opener/config.json"

  Scenario: First run with no history
    Given I have never opened any solutions before
    When I open the menu
    Then the recent solutions section should not be displayed
