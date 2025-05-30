export interface ApiLibGeneratorSchema {
  name?: string;
  useDefaults?: boolean;
  generateAccounts?: boolean;
  generateAuth?: boolean;
  generateCore?: boolean;
  generateMailer?: boolean;
  generateUser?: boolean;
  generateConfig?: boolean;
  generatePrisma?: boolean;
  generateCustom?: boolean;
}
