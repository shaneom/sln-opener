Feature: Opening Solutions
  As a developer
  I want the tool to launch the correct IDE with the selected project
  So that my project opens in the right application

  Background:
    Given I am running as an administrator

  Scenario: Open a Visual Studio solution
    Given Visual Studio is configured at "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE"
    And I select "MyApp.sln" from the menu
    When the solution is opened
    Then "devenv.exe" should be spawned with "MyApp.sln" as the argument
    And the process should be detached and run independently

  Scenario: Open a Visual Studio 2022 solution
    Given Visual Studio is configured
    And I select "MyApp.slnx" from the menu
    When the solution is opened
    Then "devenv.exe" should be spawned with "MyApp.slnx" as the argument

  Scenario: Open a JetBrains Rider project
    Given JetBrains Rider is configured at "C:\Users\User\AppData\Local\JetBrains\Toolbox\apps\Rider\ch-0\bin"
    And I select "MyApp.iml" (type: Rider) from the menu
    When the solution is opened
    Then "rider.exe" should be spawned with "MyApp.iml" as the argument
    And the process should be detached and run independently

  Scenario: Open an IntelliJ IDEA project
    Given IntelliJ IDEA is configured at "C:\Program Files\JetBrains\IntelliJ IDEA 2023.2\bin"
    And I select "MyApp.iml" (type: IntelliJ IDEA) from the menu
    When the solution is opened
    Then "idea.exe" should be spawned with "MyApp.iml" as the argument
    And the process should be detached and run independently

  Scenario: IDE not configured for selected project type
    Given JetBrains Rider is not configured
    And I select a ".iml" Rider project from the menu
    When the solution is opened
    Then I should see an error message "IDE not configured for JetBrains Rider"
    And no process should be spawned

  Scenario: Record solution in recent history after opening
    Given I select "WebApp.sln" from the menu
    When the solution is opened
    Then "WebApp.sln" should be added to the recent solutions history
    And it should be timestamped with the current time

  Scenario: IDE executable fails to launch
    Given Visual Studio is configured
    And "devenv.exe" throws an error on spawn
    When the solution is opened
    Then I should see an error message containing the error details

  Scenario: Open all solutions with mixed IDEs
    Given Visual Studio and JetBrains Rider are both configured
    And the menu shows both ".sln" and ".iml" files
    When I select "(All)"
    Then "devenv.exe" should be spawned for each ".sln" file
    And "rider.exe" should be spawned for each ".iml" file

  Scenario: Recent solutions capped at 10 items
    Given I have previously opened 10 different solutions
    When I open an 11th solution
    Then the recent solutions list should still contain only 10 items
    And the oldest entry should be removed

  Scenario: Re-opening a recent solution moves it to the top
    Given "OldProject.sln" was opened 3 days ago and is in the recent list
    When I open "OldProject.sln" again
    Then "OldProject.sln" should appear at the top of the recent list
    And it should have an updated timestamp
