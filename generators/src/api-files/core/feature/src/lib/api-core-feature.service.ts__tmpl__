import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CookieOptions } from 'express'

@Injectable()
export class ApiCoreFeatureService {
  constructor(public readonly config: ConfigService) {}

  uptime(): number {
    return process.uptime()
  }

  get apiUrl(): string {
    return this.config.get('apiUrl')
  }

  get apiCorsOrigins(): string[] {
    return this.config.get('api.cors.origin')
  }

  get cookie(): { name: string; options: CookieOptions } {
    return this.config.get('api.cookie')
  }

  get appEmail() {
    return this.config.get('app.email')
  }

  get appSupportEmail() {
    return this.config.get('app.supportEmail')
  }

  get appAdminEmails() {
    return this.config.get('app.adminEmails')
  }

  get appName() {
    return this.config.get('app.name')
  }

  get siteUrl(): string {
    return this.config.get('siteUrl')
  }

  get mailerConfig() {
    return {
      host: this.config.get('smtp.host'),
      port: this.config.get('smtp.port'),
      auth: {
        user: this.config.get('smtp.user'),
        pass: this.config.get('smtp.pass'),
      },
    }
  }
}
