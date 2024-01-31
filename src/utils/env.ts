import config from '../config';
import { networkInterfaces } from 'os';


export function getCurrentServer (): string {
  const ip = getCurrentIP()
  const servers = config.Servers

  if (servers && servers[ip]) {
    return servers[ip]
  } else {
    return ip
  }
}

export function getCurrentIP () {
  const nets = networkInterfaces()
  let address = 'parse failed'

  for (const name of Object.keys(nets)) {
    if (['eth', 'eno', 'ens', 'enp'].includes(name.substring(0, 3))) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          address = net.address
          break
        }
      }
    }
  }

  return address
}

