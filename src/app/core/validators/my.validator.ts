import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";

export class MyValidators extends Validators {
  static required(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return { required: { message: 'This field is required' } };
      } else {
        return null;
      }
    };
  }

  static maxLength(maxLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value && control.value.length > maxLength) {
        return { maxLenght: { message: `This field exceeds max length of ${maxLength}` } };
      } else {
        return null;
      }
    };
  }

  static isString(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value && !isNaN(control.value)) {
        return { isNaN: { message: `This must be a string not a number` } };
      } else {
        return null;
      }
    };
  }
}
