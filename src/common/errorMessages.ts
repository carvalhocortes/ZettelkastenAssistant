import { Error } from '../types/commonTypes'

const errorCode = (c: number): number => 4765 + c

const errorMessages = {
  requestValidationError: (): Error => ({
    httpCode: 400,
    code: errorCode(0),
    msg: ''
  }),

}

export default errorMessages
