import { ValidatorConstraint, ValidatorConstraintInterface, Validate, IsString } from "class-validator";

@ValidatorConstraint({ name: "isTimeZoneValid", async: false })
export class IsTimeZoneValid implements ValidatorConstraintInterface {
  validate(value: string): boolean {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: value });
        return true;
      } catch (e) {
        return false; 
      }
  }

  defaultMessage(): string {
    return "TimeZone must a valid zone";
  }
}
