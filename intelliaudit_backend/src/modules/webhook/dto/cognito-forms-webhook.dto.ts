import { Type } from 'class-transformer';
import {
  IsOptional, IsArray, ValidateNested, Allow
} from 'class-validator';

// --- Basic Info ---
class FormDto {
  @Allow() Id?: string;
  @Allow() InternalName?: string;
  @Allow() Name?: string;
}

class NameDto {
  @Allow() First?: string | null;
  @Allow() FirstAndLast?: string | null;
  @Allow() Last?: string | null;
}

class AddressDto {
  @Allow() City?: string;
  @Allow() CityStatePostalCode?: string;
  @Allow() Country?: string;
  @Allow() CountryCode?: string;
  @Allow() FullAddress?: string; // Crucial for matching
  @Allow() FullInternationalAddress?: string;
  @Allow() Line1?: string;
  @Allow() PostalCode?: string;
  @Allow() State?: string;
  @Allow() StreetAddress?: string;
}

export class PhotoDto {
  @Allow() Id?: string;
  @Allow() FileId?: string;
  @Allow() Name?: string; // Original filename
  @Allow() Type?: string; // Mimetype
  @Allow() Url?: string; // URL to download the photo
  @Allow() Size?: number;
}

class EntryDto {
  @Allow() Number?: number;
  @Allow() DateCreated?: string;
  @Allow() DateSubmitted?: string;
  @Allow() DateUpdated?: string;
}

// --- Repeating Sections ---
class RepeatingSectionItemDto {
  @Allow() Id?: string;
  @Allow() ItemNumber?: number;
}

class PlumbingFixturesDto extends RepeatingSectionItemDto {
  @Allow() FixtureType?: string;
  @Allow() GallonsPerMinuteGPM?: string;
  @Allow() Quantity?: string;
  @Allow() HotWaterTemperature?: string;
  @Allow() Location?: string;
  @Allow() Comments?: string;
  @Allow() MaintenanceDeficiencies?: string;
  @Allow() @IsArray() @ValidateNested({ each: true }) @Type(() => PhotoDto) PlumbingFixturePhotos?: PhotoDto[];
}

class BoilersWaterHeatersDto extends RepeatingSectionItemDto {
   @Allow() TypeOfEquipment?: string;
   @Allow() Year?: number;
   @Allow() Make?: string;
   @Allow() Model?: string;
   @Allow() Serial?: string;
   @Allow() CapacityGallons?: number;
   @Allow() NumberOfUnits?: number;
   @Allow() FuelInput?: string;
   @Allow() PowerSource?: string;
   @Allow() IsPipeInsulated?: boolean;
   @Allow() Location?: string;
   @Allow() Comments?: string;
   @Allow() MaintenanceDeficiencies?: string;
   @Allow() @IsArray() @ValidateNested({ each: true }) @Type(() => PhotoDto) WaterHeaterBoilerPhotos?: PhotoDto[];
}

class HeatingCoolingDto extends RepeatingSectionItemDto {
  @Allow() DistributionEquipmentType?: string;
  @Allow() CoolingSource?: string;
  @Allow() CompressorType?: string;
  @Allow() CondenserType?: string;
  @Allow() HeatingSource?: string;
  @Allow() HeatingFuel?: string;
  @Allow() Location?: string;
  @Allow() Comments?: string;
  @Allow() MaintenanceDeficiencies?: string;
  @Allow() @IsArray() @ValidateNested({ each: true }) @Type(() => PhotoDto) HeatingCoolingPhotos?: PhotoDto[];
  @Allow() Quantity?: string;
}

class PlugLoadsAppliancesDto extends RepeatingSectionItemDto {
  @Allow() DescriptionOfAppliance?: string;
  @Allow() PowerWattsOrTherms?: string;
  @Allow() Quantity?: number;
  @Allow() RunHours?: string;
  @Allow() FuelType?: string;
  @Allow() EnergyStarCertified?: string;
  @Allow() LoadTypeIfWasherDryer?: string;
  @Allow() Location?: string;
  @Allow() Comments?: string;
  @Allow() MaintenanceDeficiencies?: string;
  @Allow() @IsArray() @ValidateNested({ each: true }) @Type(() => PhotoDto) PlugLoadPhotos?: PhotoDto[];
}

class LightingDto extends RepeatingSectionItemDto {
  @Allow() WattsPerLamp?: string;
  @Allow() LampsPerFixture?: string;
  @Allow() NumberOfFixtures?: string;
  @Allow() Location?: string;
  @Allow() OccupancyControlTypeSchedule?: string;
  @Allow() LightingType2?: string; // Assuming 'LightingType2' is the correct field name
  // Add LightingPhotos if available in the form
  // @Allow() @IsArray() @ValidateNested({ each: true }) @Type(() => PhotoDto) LightingPhotos?: PhotoDto[];
}
// Add other repeating section DTOs (WindowsDto, MotorsPumpDto, etc.) if they contain photos or text needed for notes


// --- Main Webhook Payload DTO ---
export class CognitoFormsWebhookDto {
  // Use @Allow() for all fields since we aren't strictly validating every single one,
  // but we want the structure available. The ValidationPipe might need configuration
  // (e.g., skipMissingProperties: true) if we don't use explicit validators.
  // Alternatively, use @IsOptional() and appropriate type validators for key fields.
  @Allow() Form?: FormDto;
  @Allow() Date?: string;
  @Allow() Name?: NameDto;
  @Allow() Address?: AddressDto; // Crucial for project matching
  @Allow() BuildingUseType?: string;
  @Allow() GrossFloorArea?: string;
  @Allow() OfUnits?: number;
  @Allow() OfBedrooms?: number;
  @Allow() OfBathrooms?: number;
  @Allow() OfFloors?: number;
  @Allow() Comments?: string | null;
  @Allow() Comments2?: string | null; // Example of multiple comment fields
  @Allow() @IsArray() @IsOptional() WhichOfTheseSourcesArePresent?: string[];
  @Allow() @IsArray() @IsOptional() WhichOfTheseUtilitesDoTenantsPay?: string[];
  @Allow() @IsArray() @IsOptional() WhichOfTheseAppliancesAreSupplisedByTheOwner?: string[]; // Typo from payload

  // Repeating Sections
  @Allow() @IsArray() @ValidateNested({ each: true }) @Type(() => PlumbingFixturesDto) @IsOptional() PlumbingFixtures?: PlumbingFixturesDto[];
  @Allow() @IsArray() @ValidateNested({ each: true }) @Type(() => BoilersWaterHeatersDto) @IsOptional() BoilersWaterHeaters?: BoilersWaterHeatersDto[];
  @Allow() @IsArray() @ValidateNested({ each: true }) @Type(() => HeatingCoolingDto) @IsOptional() HeatingCooling?: HeatingCoolingDto[];
  @Allow() @IsArray() @ValidateNested({ each: true }) @Type(() => PlugLoadsAppliancesDto) @IsOptional() PlugLoadsAppliances?: PlugLoadsAppliancesDto[];
  @Allow() @IsArray() @ValidateNested({ each: true }) @Type(() => LightingDto) @IsOptional() Lighting2?: LightingDto[]; // Using name from payload
  // Add other repeating section properties here (e.g., Windows, MotorsPump, PoolsSpa)

  // Entry Info
  @Allow() Entry?: EntryDto;
  @Allow() Id?: string; // Entry ID "FormId-EntryNumber"

  // Building Photos (if there's a top-level photo field)
  @Allow() @IsArray() @ValidateNested({ each: true }) @Type(() => PhotoDto) @IsOptional() BuildingPhoto?: PhotoDto[];
  @Allow() @IsArray() @ValidateNested({ each: true }) @Type(() => PhotoDto) @IsOptional() IrrigationPhotos?: PhotoDto[];
  @Allow() @IsArray() @ValidateNested({ each: true }) @Type(() => PhotoDto) @IsOptional() DoorPhotos?: PhotoDto[];
  @Allow() @IsArray() @ValidateNested({ each: true }) @Type(() => PhotoDto) @IsOptional() LightingPhotos?: PhotoDto[];

  // Add any other top-level fields from the payload
  // Example:
  @Allow() YourEmailAddress?: string;
  @Allow() ClientEmailAddress?: string;
  @Allow() Project?: string; // This seems like a project name/identifier?
    BuildingName: string | undefined;
    BuildingLength2: string;
    BuildingWidth2: string;
    AreThereElevatorsAtTheProperty: any;
    DoesBuildingHaveMaintenanceDepartment: any;
    AreHVACLightingHoursDifferentThanOperatingHours: any;
}