import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errorMessages 
      });
    }
    
    next();
  };
};

// Validation schemas
export const participantSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  phoneNumber: Joi.string().pattern(/^(\+972|972|05)[0-9]{8,9}$/).required()
});

export const sessionSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(1000).allow(''),
  date: Joi.date().iso().required(),
  time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  showResponsesToParticipants: Joi.boolean().default(false)
});

export const responseSchema = Joi.object({
  status: Joi.string().valid('joining', 'not_joining', 'maybe').required()
});

export const otpRequestSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^(\+972|972|05)[0-9]{8,9}$/).required()
});

export const otpVerifySchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^(\+972|972|05)[0-9]{8,9}$/).required(),
  code: Joi.string().length(6).pattern(/^[0-9]+$/).required()
});

export const updateResponseSchema = Joi.object({
  participantId: Joi.string().uuid().required(),
  status: Joi.string().valid('joining', 'not_joining', 'maybe').required()
});