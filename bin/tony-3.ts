#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tony3Stack } from '../lib/tony-3-stack';

const app = new cdk.App();
new Tony3Stack(app, 'Tony3Stack');
