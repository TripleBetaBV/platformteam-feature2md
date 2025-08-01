Feature: Vehicle Detection and Entry Control
  As a car wash operator
  I want the system to safely detect and control vehicle entry
  So that vehicles are properly positioned and processed safely

  Scenario: Just a happy day wash flow
    Given the sun is shing
    When the weather is sleepy
    Then wash the car
    And smile

  Rule: Vehicle entry detection
    The system must accurately detect when a vehicle enters the wash tunnel
    and ensure proper positioning before starting the wash cycle.

    Scenario: Vehicle successfully enters wash tunnel
      Given the car wash system is ready and operational
      When a vehicle enters the wash tunnel
      Then the system should detect the vehicle presence
      And the system should verify the vehicle is properly positioned
      And the vehicle entry should be logged

    Scenario: Vehicle positioning validation
      Given a vehicle has been detected at the tunnel entrance
      When the system checks vehicle positioning
      Then the vehicle position should be validated as correct
      And the wash cycle should be authorized to start

  Rule: Multiple vehicle prevention
    The system must prevent multiple vehicles from entering the wash tunnel
    simultaneously to avoid collisions and ensure safety.

    Scenario: Second vehicle blocked when tunnel is occupied
      Given a vehicle is currently in the wash tunnel
      When a second vehicle attempts to enter
      Then the entry should be blocked
      And a warning signal should be activated
      And the second vehicle should wait until the tunnel is clear

    Scenario: Tunnel clear detection for next vehicle
      Given a vehicle has completed the wash cycle and exited
      When the system detects the tunnel is clear
      Then the entry control should reset to ready state
      And the next vehicle should be allowed to enter
