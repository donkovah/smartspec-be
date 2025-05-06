import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

const YAML_CONFIG_FILENAME = `config/${process.env.NODE_ENV || 'development'}.yml`;

export default () => {
  try {
    const config = yaml.load(
      readFileSync(join(__dirname, '..', '..', YAML_CONFIG_FILENAME), 'utf8'),
    );
    return config as Record<string, unknown>;
  } catch {
    throw new Error(
      `Failed to load configuration file: ${YAML_CONFIG_FILENAME}`,
    );
  }
};
