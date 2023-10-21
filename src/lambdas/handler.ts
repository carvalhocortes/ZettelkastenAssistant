'use strict'

import { HttpResponse } from '../types/commonTypes'

export const hello = (event: Event): HttpResponse => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(
      {
        message: 'Hello world',
        input: event,
      }
    )
  }
}
