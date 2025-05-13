import { Expose, Type } from "class-transformer";
import { IsIn, IsInt, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { SubScriptionBenefits } from "./subscriptionBenefits";

export class CreateSubscriptionDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  description: string;

  @Expose()
  @IsInt()
  price: number;

  @Expose()
  @IsIn(["month", "year"])
  interval: "month"|"year";

  @Expose()
  @ValidateNested()
  @Type(() => SubScriptionBenefits)
  benefit: SubScriptionBenefits;
}
