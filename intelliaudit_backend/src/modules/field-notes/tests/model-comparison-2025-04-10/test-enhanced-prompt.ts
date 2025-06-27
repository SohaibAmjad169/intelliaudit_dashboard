import { EnergyBreakdownService, EndUseComponent } from '../../services/energy-breakdown.service';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { enhancedPrompt } from './test-prompt';
import { OpenAI } from 'openai';

// Load environment variables with multiple possible paths
const envPaths = [
  path.resolve(__dirname, '../../../..', '.env'),
  path.resolve(__dirname, '../../../../..', '.env'),
  path.resolve(process.cwd(), '.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`Loading .env from: ${envPath}`);
    dotenv.config({ path: envPath });
    break;
  }
}

// Sample field notes from the original test
const sampleFieldNotes = `
4623 La Mirada Ave, Los Angeles, CA 90029 

 

Bill Leslie  

 

8.12.2024  

 

 

Front exterior southside  

 

Garden lights 9.5 W LED Wi-Fi bulbs x4  

 

Sprinklers  

 

Desert native plants  

 

Surface mounted LED lights 9.5 watts x2  

 

Recessed LED 9.5 W x4  

 

Surface mounted LED 9.5 W x7  

 

 

Exterior east side  

 

CFL 13 W recessed x4  

 

 

Exterior westside  

 

Surface mount recessed LED 9.5 W x4  

 

 

Exterior northside  

 

LED surface mounted 20 W two bulbs per fixture estimated x1  

 

 

LED wall pack 55 W estimate surface mounted one is always on three are off  

 

 

LED surface mounted 10 W estimate x4  

 

Round CFL T9 22 W x1  

 

 

Lobby/interior of building /ground floor  

 

9.5 W recessed always on LED x13  

 

9.5 W recessed off LED x4  

 

13 W CFL x7  

 

 

First floor is just like the second floor so the below numbers can be doubled  

 

9.5 watt always on recessed x11  

 

9.5 watt off recessed x4  

 

CFL 32 W always on x1  

 

Round fluorescent light 32 watts x2  

 

 

The second floor has Eight extra 9.5 watt recessed LED lights  

 

 

Unit 41  

 

LED light fixture CFL 13 watts five bulbs per fixture one fixture  

 

Wall scone empty  

 

 

Entryway light  

 

LED 10 W estimate  

 

 

Kitchen table fan light Three bulbs per fixture one fixture incandescent 25 W  

 

 

Kitchen  

 

Refrigerator  

 

Faucet 106°F supply temperature  

 

Faucet .6 gallons per minute  

 

Electric stove, oven combination  

 

Microwave  

 

Exhaust fan  

 

Kitchen light 10 watts led x1  

 

no dishwasher  

 

 

Single pane windows  

 

 

PT unit Gibson 58F supply temperature cooling  

 

Filter dirty tape covering removal  

 

Wall furnace Only on in winter  

 

 

Hallway light 23 W CFL Surface mounted x1  

 

 

Bedroom one  

 

Fan light cfl 23 watts x1  

 

Task light incandescent 25 watts est  

 

Task light LED 10 W est  

 

 

Bedroom two  

 

Fan light Ceiling Three bulbs per fixture LED 10 W est x3  

 

Task light CFL 13 watts x2  

 

 

Bathroom  

 

Toilet 1.28 gpf  

 

Faucet .6 gpm  

 

Faucet 119 F supply temperature heating  

 

Shower 1.5 gpm  

 

LED lights 10 watts x2  

 

No Exhaust fan  

 

Electric wall heater  

 

 

Unit 32  

 

 

Entryway light 10 W LED x2  

 

Closet hundred watts incandescent  

 

Shoes shoes  

 

 

Kitchen  

 

Refrigerator  

 

Faucet .8 gallons per minute  

 

Faucet 114 F supply heating temperature  

 

Dishwasher  

 

Electric oven stove combo  

 

Exhaust fan  

 

Exhaust light 10 watt LED est.  

 

Kitchen light 10 watts led x2  

 

Kitchen table light LED 10 watt est x2  

 

Single pane windows  

 

Microwave  

 

 

Wall PTC cooling only  

 

Wall furnace  

 

 

hallway light  

 

 

Bathroom  

 

LED light 10 watts est.  

 

No exhaust fan  

 

Toilet 1.28 gallons per flush  

 

Faucet .4 gallons per minute  

 

Faucet 115 F supply heating temperature  

 

Shower  

 

Electric heater  

 

 

Bedroom one  

 

Surface mounted LED lightbulb 20 watts est x1  

 

Computer laptop x1  

 

 

Bedroom two  

 

Portable air conditioner  

 

Surface mounted ceiling light LED 20 watts est.  

 

 

 

 

Tenants pay electricity and gas  

 

The water bill is divided by the number of tenants  

 

There are 49 units  

 

There are two bedrooms one bathroom x10  

 

There are single bedrooms one bathroom x18  

 

And there are studios one bathroom x21  

 

Some tenants bring their own refrigerators summer supplied  

 

Some tenants bring their own microwaves summer supplied  

 

 

Unit 31  

 

Ptac cooling supply temperature 52F  

 

Wall furnace  

 

CO2 under 1000 ppm  

 

 

Pole light LED 10 watts est  

 

Closet CFL 23 watts x1  

 

 

Kitchen  

 

Electric oven stove combo  

 

Dishwasher  

 

Refrigerator  

 

Freezer  

 

Faucet .6 gallons per minute  

 

Faucet 104 F heating supply temperature  

 

Kitchen light 10 watts x2 LED  

 

Microwave included from landlord  

 

Pole light LED 10 watts est  

 

Exhaust fan  

 

Microwave light 5 watts est x1 recessed  

 

 

Bathroom  

 

Toilet 1.28 gallons per flush  

 

Shower  

 

Faucet .4 gallons per minute  

 

Faucet  

 

Lights LED 6 watt x3  

 

Electric wall furnace  

 

No exhaust fan  

 

Single pane windows  

 

 

Bedroom one  

 

Surface mounted light LED 10 watts x1  

 

Computer station  

 

 

bedroom two  

 

Surface mounted light ceiling 10 watts est x1  

 

Computer station station  

 

Movable window ptac  

 

 

Unit 11  

 

Vacant  

 

Ptac  

 

Wall furnace  

 

 

Hallway, scone light 9.5 watts x1  

 

Manual switches throughout all units  

 

 

Kitchen  

 

Microwave  

 

Electric stove  

 

Faucet 2.3 gallons per minute  

 

No aerator  

 

Faucet 105°F supply temperature  

 

Single pane windows  

 

Kitchen light 10 watts led est  

 

Exhaust fan  

 

Exhaust light 5 watts led est  

 

No dishwasher  

 

Single pane windows  

 

 

Closet LED 10 watts x1 Surface mounted  

 

 

Bathroom  

 

Toilet 1.28 gpf  

 

Faucet .5 gallons per minute  

 

Shower  

 

Exhaust fan  

 

Light fixture 9.5 W suspended x3  

 

 

Laundry room  

 

Top load washer x4  

 

Gas dry x4  

 

Single pain window  

 

Ceiling mounted lights x2 LED 20 watts est on manual light switch  

 

 

Manual electric timers  

 

Time is correct  

 

Trippers are present  

 

 

Mechanical room  

 

Hot water heater x2  

 

Pool filter  

 

Ceiling mounted LED lights x2 on manual switch  

 

 

 

Get Outlook for iOS 
`;

async function testEnhancedPrompt(modelToUse: string = 'gpt-4o-mini') {
  try {
    const resultSuffix = modelToUse.replace(/[^a-zA-Z0-9]/g, '-');
    
    // Load environment variable again to ensure it's loaded
    const apiKey = process.env.OPENAI_API_KEY;
    
    console.log(`API Key available: ${!!apiKey}`);
    
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set in the environment');
      throw new Error('OpenAI API key is missing');
    }
    
    // Create OpenAI client directly to bypass service's system prompt
    const openai = new OpenAI({
      apiKey: apiKey, // Explicitly pass the API key
    });
    
    // Create energy breakdown service with a simple mock repository and mock config service
    const mockConfigService = {
      get: (key: string) => {
        // Mock the OpenAI API key config
        if (key === 'OPENAI_API_KEY') return process.env.OPENAI_API_KEY || 'mock-api-key';
        return null;
      }
    } as any;
    
    const energyBreakdownService = new EnergyBreakdownService({} as any, mockConfigService);

    console.log(`Sending field notes to OpenAI with enhanced prompt using model: ${modelToUse}...`);
    
    // Process with OpenAI directly using our custom prompt
    // o1 model doesn't support temperature parameter
    const completion = await openai.chat.completions.create(
      modelToUse === 'o1' 
        ? {
            messages: [
              { role: 'system', content: enhancedPrompt },
              { role: 'user', content: sampleFieldNotes }
            ],
            model: modelToUse,
            response_format: { type: 'json_object' }
          }
        : {
            messages: [
              { role: 'system', content: enhancedPrompt },
              { role: 'user', content: sampleFieldNotes }
            ],
            model: modelToUse,
            response_format: { type: 'json_object' },
          }
    );
    
    const responseContent = completion.choices[0]?.message?.content || '';
    
    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }
    
    // Parse JSON response
    const result = JSON.parse(responseContent);
    
    // Save the result to a file for detailed review with model name suffix
    fs.writeFileSync(
      path.join(__dirname, `enhanced-openai-result-${resultSuffix}.json`), 
      JSON.stringify(result, null, 2)
    );

    // Output key info to console
    console.log('\nProcessing complete!');
    console.log(`Found ${result.equipment.length} equipment items`);
    console.log(`Confidence: ${result.metadata?.confidence || 1}`);
    console.log(`Processing time: ${result.metadata?.processingTimeMs || completion.usage?.total_tokens}ms`);
    
    if (result.flags && result.flags.length > 0) {
      console.log('\nFlags:');
      result.flags.forEach((flag: { severity: string; message: string }) => {
        console.log(`- [${flag.severity}] ${flag.message}`);
      });
    }
    
    // Generate energy breakdown (using actual values from La Mirada project)
    const totalElectricKwh = 129517; // From the image in the transcript
    const totalGasTherms = 552; // From the image in the transcript
    
    const energyBreakdown = energyBreakdownService.generateEnergyBreakdown(
      result.equipment,
      totalElectricKwh,
      totalGasTherms,
      0, // No steam
      0, // No other
      'multifamily' // Building type
    );
    
    // Save energy breakdown to file with model name suffix
    fs.writeFileSync(
      path.join(__dirname, `energy-breakdown-result-${resultSuffix}.json`), 
      JSON.stringify(energyBreakdown, null, 2)
    );
    
    // Generate tabular display similar to the engineer's table
    generateEnergyBreakdownTable(energyBreakdown);
    
    console.log(`\nSee full results in enhanced-openai-result-${resultSuffix}.json and energy-breakdown-result-${resultSuffix}.json`);
    
    return {
      modelName: modelToUse,
      equipmentCount: result.equipment.length,
      confidence: result.metadata?.confidence || 1,
      processingTime: result.metadata?.processingTimeMs || completion.usage?.total_tokens,
      flagCount: result.flags?.length || 0,
      breakdown: energyBreakdown
    };
  } catch (error) {
    console.error('Error testing enhanced prompt:', error);
    return null;
  }
}

function generateEnergyBreakdownTable(breakdown: {
  endUseComponents: {
    name: string;
    electricPercent: number;
    gasPercent: number;
    electricKwh: number;
    gasTherms: number;
  }[];
  totalActualElectric: number;
  totalActualGas: number;
}) {
  console.log('\n--- Energy Use Breakdown ---');
  console.log('-------------------------------------------------------');
  console.log('                | Percent of Total Energy | Est. Energy Use');
  console.log('End Use Component | Electric % | Gas % | Electric | Gas');
  console.log('-------------------------------------------------------');
  
  breakdown.endUseComponents.sort((a, b) => b.electricPercent - a.electricPercent).forEach(component => {
    if (component.electricPercent > 0 || component.gasPercent > 0) {
      console.log(
        `${component.name.padEnd(17)} | ${component.electricPercent.toString().padEnd(10)} | ${component.gasPercent.toString().padEnd(5)} | ${component.electricKwh.toString().padEnd(9)} | ${component.gasTherms.toString().padEnd(5)}`
      );
    }
  });
  
  console.log('-------------------------------------------------------');
  console.log(`Total Estimated | 100% | 100% | ${breakdown.totalActualElectric} | ${breakdown.totalActualGas}`);
  console.log('-------------------------------------------------------');
}

// Run the test
if (process.argv.length > 2) {
  // Run for a specific model
  testEnhancedPrompt(process.argv[2]);
} else {
  // Run for all models and compare
  async function runAllModels() {
    console.log('Running tests with multiple models for comparison...\n');
    
    const models = ['gpt-4o-mini', 'gpt-4o', 'o1'];
    const results = [];
    
    for (const model of models) {
      console.log(`\n===== TESTING MODEL: ${model} =====\n`);
      const result = await testEnhancedPrompt(model);
      if (result) results.push(result);
      console.log('\n==================================\n');
    }
    
    // Compare the results
    console.log('\n===== MODEL COMPARISON =====\n');
    console.log('Model | Equipment | Confidence | Processing Time | Flags');
    console.log('-----|-----------|------------|----------------|------');
    
    for (const result of results) {
      console.log(`${result.modelName.padEnd(10)} | ${result.equipmentCount.toString().padEnd(11)} | ${result.confidence.toString().padEnd(12)} | ${result.processingTime.toString().padEnd(16)} | ${result.flagCount}`);
    }
    
    console.log('\n=== Energy Breakdown Comparison ===\n');
    
    const categories = ['Refrigeration', 'Cooling', 'Lighting', 'Cooking', 'Pool/Spa', 'Office Equipment', 'Ventilation', 'Heating', 'Water Heating'];
    
    // Column headers
    let header = 'Category | ';
    for (const result of results) {
      header += `${result.modelName} | `;
    }
    header += 'Ryan\'s Est.';
    console.log(header);
    
    console.log('-'.repeat(header.length));
    
    // Ryan's estimates (percentage of electricity)
    const ryanEstimates: Record<string, string> = {
      'Refrigeration': '26%',
      'Cooling': '25%',
      'Lighting': '21%',
      'Cooking': '1%',
      'Pool/Spa': '0%',
      'Office Equipment': '9%',
      'Ventilation': '5%',
      'Heating': '0%',
      'Water Heating': '0%'
    };
    
    // Calculate similarity scores against Ryan's estimates
    const modelScores: Record<string, number> = {};
    
    for (const result of results) {
      let totalDiff = 0;
      let categoriesCompared = 0;
      
      for (const category of categories) {
        const component = result.breakdown.endUseComponents.find((c: EndUseComponent) => c.name === category);
        const modelPercent = component ? component.electricPercent : 0;
        const ryanPercent = parseInt(ryanEstimates[category] || '0', 10);
        
        // Calculate absolute difference
        const diff = Math.abs(modelPercent - ryanPercent);
        totalDiff += diff;
        categoriesCompared++;
      }
      
      // Calculate average difference (lower is better)
      const avgDiff = totalDiff / categoriesCompared;
      modelScores[result.modelName] = avgDiff;
    }
    
    // Print each category
    for (const category of categories) {
      let row = `${category.padEnd(10)} | `;
      
      for (const result of results) {
        const component = result.breakdown.endUseComponents.find((c: EndUseComponent) => c.name === category);
        const percent = component ? `${component.electricPercent}%` : '0%';
        row += `${percent.padEnd(10)} | `;
      }
      
      row += ryanEstimates[category] || '0%';
      console.log(row);
    }
    
    console.log('\n=== Recommendations ===\n');
    
    console.log('Based on the analysis above, the recommended model for production use is:');
    
    // Determine the best model based on the comparison
    let bestModel = '';
    let bestModelReason = '';
    let lowestScore = Infinity;
    
    for (const [model, score] of Object.entries(modelScores)) {
      if (score < lowestScore) {
        lowestScore = score;
        bestModel = model;
      }
    }
    
    // Add processing time and equipment count to the decision
    const bestResult = results.find(r => r.modelName === bestModel);
    
    if (bestResult) {
      bestModelReason = `Closest match to Ryan's energy breakdown (average difference: ${lowestScore.toFixed(1)}%), identified ${bestResult.equipmentCount} equipment items in ${bestResult.processingTime}ms`;
    }
    
    console.log(`- ${bestModel}: ${bestModelReason}`);
  }
  
  runAllModels();
} 