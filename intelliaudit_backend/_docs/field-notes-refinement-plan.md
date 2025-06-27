# Field Notes Processing Refinement Plan

## Overview

This document outlines the refinement plan for the field notes processing pipeline after initial testing. The current implementation successfully extracts equipment information from unstructured field notes and generates energy breakdowns, but several issues need to be addressed to improve accuracy and align with engineer workflows.

## Current State

### Strengths
- Enhanced prompt extracts more equipment items (25 vs 6 in original)
- Detailed equipment properties including location, wattage, quantity
- End-use categorization in place
- Energy breakdown calculation framework established

### Issues Identified
1. **Category Imbalance**: All equipment is categorized as Lighting
2. **Missing Equipment**: HVAC, water heaters, and appliances not properly identified
3. **Gas Usage**: No gas usage allocated to any category
4. **Annual kWh Calculations**: Energy calculations appear incorrect (too low)
5. **Repository Type Conversion**: Decimal vs number type issues between database and DTO

## Refinement Plan

### Phase 1: Prompt Improvement

1. **Enhance Equipment Type Recognition**
   - Add more specific guidance for identifying non-lighting equipment
   - Emphasize HVAC, water heating, appliances, and gas-using equipment
   - Add explicit examples of each equipment type in the prompt

2. **Improve Energy Usage Calculations**
   - Provide guidance on realistic annual kWh calculations
   - Adjust formulas for operating hours (e.g., lights 12 hrs/day, HVAC 8 hrs/day)
   - Add examples of typical equipment energy usage

3. **Gas Equipment Identification**
   - Emphasize identification of gas-powered equipment
   - Add explicit prompting for fuel source identification

### Phase 2: Energy Breakdown Enhancement

1. **Fallback Distribution**
   - When insufficient equipment is identified, implement logic to use typical distributions
   - Use building type to determine appropriate fallback percentages

2. **Category Mapping Refinement**
   - Improve the mapping of equipment types to end-use categories
   - Add more nuanced handling of equipment with dual purposes

3. **Reconciliation Logic**
   - Enhance reconciliation with utility data
   - When calculated usage differs significantly from actual, adjust proportionally

### Phase 3: Testing and Validation

1. **Test Cases**
   - Create a comprehensive test suite with various building types
   - Include edge cases (buildings with unusual equipment mixes)
   - Compare with manually prepared energy breakdowns

2. **Metric Development**
   - Define metrics for prompt accuracy (equipment identification)
   - Define metrics for energy breakdown accuracy
   - Track improvements across iterations

### Phase 4: Integration

1. **API Endpoint Enhancement**
   - Update API endpoints to include energy breakdown
   - Add optional parameters for utility data input

2. **UI Integration**
   - Add visualization for energy breakdown in the frontend
   - Create UI components for reviewing and adjusting breakdowns

## Implementation Timeline

### Immediate Actions (Week 1)
- [x] Fix type conversion issues in repository
- [ ] Refine OpenAI prompt for better equipment identification
- [ ] Adjust energy calculation formulas

### Short Term (Weeks 2-3)
- [ ] Implement fallback distribution logic
- [ ] Enhance category mapping
- [ ] Develop test cases

### Medium Term (Weeks 4-6)
- [ ] Complete testing and validation
- [ ] Refine based on test results
- [ ] Update API endpoints

### Long Term (Weeks 7-8)
- [ ] UI integration
- [ ] Documentation updates
- [ ] User acceptance testing

## Metrics for Success

1. **Equipment Identification Rate**: >90% of equipment mentioned in field notes
2. **Category Distribution**: Equipment properly distributed across at least 5 categories
3. **Energy Calculation Accuracy**: Within 10% of manually calculated values
4. **Gas Usage Allocation**: Appropriate distribution of gas usage
5. **Processing Time**: <2 minutes end-to-end

## Conclusion

The field notes processing pipeline has shown promising results but requires refinement to match the accuracy and nuance of manual processing. This plan outlines the steps to systematically improve the pipeline and achieve parity with human engineers.

By focusing on prompt enhancement, energy breakdown logic, and comprehensive testing, we can create a reliable automated solution that reduces manual effort while maintaining high accuracy. 