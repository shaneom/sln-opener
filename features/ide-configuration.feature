Feature: IDE Configuration
  As a developer
  I want the tool to find and remember my IDE installation paths
  So that I don't have to configure it every time I run it

  Background:
    Given I am running as an administrator

  Scenario: Auto-detect Visual Studio on first run
    Given no IDE paths are configured
    And Visual Studio is installed at "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE"
    When the tool starts up
    Then it should detect the Visual Studio installation
    And prompt me to confirm or skip it

  Scenario: Auto-detect JetBrains Rider via JetBrains Toolbox
    Given no IDE paths are configured
    And Rider is installed via JetBrains Toolbox at "%LOCALAPPDATA%\JetBrains\Toolbox\apps\Rider"
    When the tool starts up
    Then it should detect the Rider installation
    And prompt me to confirm or skip it

  Scenario: Auto-detect IntelliJ IDEA in Program Files
    Given no IDE paths are configured
    And IntelliJ IDEA is installed at "C:\Program Files\JetBrains\IntelliJ IDEA 2023.2\bin"
    When the tool starts up
    Then it should detect the IntelliJ IDEA installation
    And prompt me to confirm or skip it

  Scenario: No IDEs detected on system
    Given no IDE paths are configured
    And no supported IDEs are installed on the system
    When the tool starts up
    Then I should see a warning that no IDEs were detected
    And I should be given the option to enter paths manually
    And I should be able to skip any IDE configuration

  Scenario: Manually enter Visual Studio path
    Given no IDEs were auto-detected
    When I enter a valid VS path containing "devenv.exe"
    Then the path should be saved to configuration
    And the tool should proceed to solution discovery

  Scenario: Enter invalid Visual Studio path
    Given no IDEs were auto-detected
    When I enter a path that does not contain "devenv.exe"
    Then I should see a warning that devenv.exe was not found
    And I should be prompted to enter the path again

  Scenario: Skip IDE configuration
    Given no IDEs were auto-detected
    When I press Enter to skip each IDE prompt
    Then I should see a warning that no IDEs are configured
    And configuration should be saved to "~/.sln-opener/config.json"

  Scenario: Return cached paths on subsequent runs
    Given Visual Studio path is already configured as "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE"
    When the tool starts up
    Then it should not prompt for IDE paths again
    And it should use the stored configuration

  Scenario: Configuration stored in user home directory
    Given I complete IDE configuration
    Then the configuration should be saved to "~/.sln-opener/config.json"
    And the config should contain the IDE paths I entered

  Scenario: Multiple Visual Studio versions found
    Given no IDE paths are configured
    And Visual Studio 2019 is installed
    And Visual Studio 2022 is installed
    When the tool starts up
    Then it should list both versions
    And I should be able to select which version to use
