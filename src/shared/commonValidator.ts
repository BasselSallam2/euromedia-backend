import type { ValidationChain } from "express-validator";
import type { Request } from "express";

class CommonValidator {
  static text(
    field: any,
    minLength: number = 3,
    maxLength?: number
  ): ValidationChain {
    let chain = field
    .optional({ nullable: true })
      .isString()
      .withMessage(`field must be a string`)
      .isLength({ min: minLength })
      .withMessage(`field must be at least ${minLength} characters long`);

    if (maxLength) {
      chain = chain
        .isLength({ min: minLength, max: maxLength })
        .withMessage(
          `field must be between ${minLength} and ${maxLength} characters long`
        );
    }

    return chain;
  }

  static Number(
    field: any,
    minimum: number,
    maximum?: number
  ): ValidationChain {
    let chain = field ;
    if(maximum){
      chain = field
      .isFloat({ min: minimum, max: maximum })
      .withMessage(`field must be between ${minimum} and ${maximum} characters long`);
    }else{
      chain = field
      .isFloat({ min: minimum })
      .withMessage(`field must be at least ${minimum} characters long`);
    }

    return chain;
  }
}

class CommonUserVlidator extends CommonValidator {
  constructor() {
    super();
  }

  static email(field: any): ValidationChain {
    let chain = field.isEmail().withMessage("Must be a valid email");
    return chain;
  }

  static confirmPassword(
    passwordField: any,
    confirmFieldName: string
  ): ValidationChain {
    return passwordField.custom((value: string, context: { req: Request }) => {
      const req = context.req;
      if (value !== req.body[confirmFieldName]) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    });
  }

  static isExict(field: any): ValidationChain {
    return field.not().isEmpty().withMessage("field is required");
  }
}

export { CommonUserVlidator, CommonValidator };
