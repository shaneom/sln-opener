Feature: Main Menu
  As a developer
  I want an interactive menu to select which project to open
  So that I can quickly choose from multiple discovered solutions

  Background:
    Given I am running as an administrator
    And at least one IDE is configured

  Scenario: Single solution opens automatically
    Given only one solution file is found: "MyApp.sln"
    When the menu loads
    Then "MyApp.sln" should be opened immediately without showing a menu

  Scenario: Multiple solutions show a numbered menu
    Given multiple solution files are found:
      | file          |
      | WebApp.sln    |
      | Backend.sln   |
      | MobileApp.iml |
    When the menu loads
    Then a numbered list of solutions should be displayed
    And option 1 should be "(All)"
    And an Exit option should be shown

  Scenario: Select a specific solution by number
    Given the menu is showing 3 solutions
    When I enter "2"
    Then the second solution in the list should be opened

  Scenario: Open all solutions at once
    Given the menu is showing multiple solutions
    When I enter "1"
    Then all discovered solutions should be opened

  Scenario: Exit the menu
    Given the menu is displaying solutions
    When I select the Exit option
    Then the process should exit without opening any solution

  Scenario: Invalid menu selection
    Given the menu is showing 3 solutions
    When I enter "99"
    Then I should see an error message "Invalid selection"
    And the menu should be displayed again

  Scenario: Press Enter to trigger new search
    Given the menu is showing solutions
    When I press Enter without entering a number
    Then the search prompt should be displayed

  Scenario: Search solutions by name
    Given the menu is loaded with solutions:
      | file              |
      | WebApp.sln        |
      | BackendService.sln|
      | MobileApp.iml     |
    When I search for "web"
    Then only "WebApp.sln" should appear in the filtered results
    And the result count should show "1 of 3"

  Scenario: Search solutions by directory path
    Given solutions exist at:
      | path                              |
      | C:\Projects\web\WebApp.sln        |
      | C:\Projects\backend\Service.sln   |
    When I search for "backend"
    Then only "Service.sln" should appear in the filtered results

  Scenario: Search with no matches
    Given the menu is loaded with solutions
    When I search for "zzznomatch"
    Then I should see a message that no solutions match the search term
    And I should be prompted to search again

  Scenario: Clear filter to show all solutions
    Given I have filtered solutions by "web"
    When I select "(Clear Filter)"
    Then all solutions should be displayed again
    And the filter should be removed

  Scenario: Display IDE label next to solution name
    Given solutions from multiple IDEs are found
    When the menu is displayed
    Then each solution should show its IDE label in brackets, e.g. "[Visual Studio]"

  Scenario: Display recently opened solutions
    Given I have previously opened "WebApp.sln" 2 hours ago
    And I have previously opened "Backend.sln" 1 day ago
    When the menu loads with all solutions shown
    Then a "RECENT (Last 5 opened)" section should appear at the top
    And "WebApp.sln" should show "2h ago"
    And "Backend.sln" should show "1d ago"

  Scenario: Recently opened section not shown when filtering
    Given I have recently opened solutions
    When I search for a specific term
    Then the recent solutions section should not be shown in the filtered results

  Scenario: No recent solutions on first run
    Given no solutions have been opened previously
    When the menu loads
    Then the recent solutions section should not be displayed
