import client from './client'

export const emulationApi = {
  getConfig: () => client.get('/emulation/'),
  start: () => client.post('/emulation/start'),
  stop: () => client.post('/emulation/stop'),
  reset: () => client.post('/emulation/reset'),
  addTopology: (topology) => client.post('/emulation/topology', topology),
  updateInstanceTypes: (instanceTypes) => client.post('/emulation/update', instanceTypes),
}
