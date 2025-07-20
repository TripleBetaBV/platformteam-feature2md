Feature: Safety and Emergency Handling
  As a car wash operator
  I want comprehensive safety controls and emergency procedures
  So that operations can be stopped safely when needed

  Rule: Emergency stop functionality
    The system must provide immediate emergency stop capability
    from multiple locations to ensure operator and customer safety.

    Scenario: Emergency stop during wash cycle
      Given a vehicle is currently being washed
      And the wash cycle is in progress
      When an emergency stop button is pressed
      Then all mechanical operations should stop immediately
      And all chemical dispensing should cease
      And emergency lighting should be activated
      And the incident should be logged with timestamp

    Scenario: Emergency stop system reset and recovery
      The emergency stop scenario is one of the more complex ones
      and needs special attention.

      Given an emergency stop has been activated
      And the emergency condition has been resolved
      When the operator initiates system reset
      Then all equipment should return to safe idle state
      And system status should be verified before resuming operations
      And operator confirmation should be required to restart

  Rule: Equipment malfunction detection
    The system must continuously monitor equipment status
    and respond appropriately to malfunctions or failures.

    Scenario: Conveyor motor failure detection
      Given the conveyor system is operating normally
      When a conveyor motor malfunction is detected
      Then the conveyor should stop immediately
      And all wash operations should be suspended
      And maintenance alert should be triggered
      And the malfunction should be logged for analysis

    Scenario: Chemical system leak detection
      Given the chemical dispensing system is operational
      When a leak or pressure drop is detected in chemical lines
      Then the affected chemical pump should shut down
      And backup containment procedures should activate
      And operator notification should be sent immediately
      And the system should switch to water-only mode if safe
