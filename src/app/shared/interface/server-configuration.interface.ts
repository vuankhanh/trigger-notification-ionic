export type ServerConfiguration = {
  address: NetworkAdress,
}

export type NetworkAdress = {
  protocol: 'ws' | 'wss',
  ipOrDomain: string,
  port: number
}