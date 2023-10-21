export type DateInterval = {
  startDate: number
  endDate: number
}

export type HttpResponse = {
  statusCode: number
  headers: any
  body: string
}

export type Error = {
  code: number
  httpCode: number
  msg: string
}
