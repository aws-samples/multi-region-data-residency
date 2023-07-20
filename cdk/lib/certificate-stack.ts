import {
  CfnOutput, Stack, StackProps,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';

interface CertificateStackProps extends StackProps {
  siteDomain: string,
  hostedZoneId: string,
}

// SSL Certificate has to be deployed into us-east-1
// https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_certificatemanager-readme.html#cross-region-certificates 

export default class CertificateStack extends Stack {
  public zone: IHostedZone;

  public certificate: Certificate;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, props);
    const { siteDomain, hostedZoneId } = props;

    const zone = HostedZone.fromHostedZoneAttributes(this, 'Zone', {
      zoneName: siteDomain,
      hostedZoneId,
    });

    // TLS certificate
    const certificate = new Certificate(this, 'AppCertificate', {
      domainName: `*.${siteDomain}`,
      validation: CertificateValidation.fromDns(zone),
    });

    new CfnOutput(this, 'CertificateArn', { value: certificate.certificateArn });
    this.certificate = certificate;
    this.zone = zone;
  }
}
