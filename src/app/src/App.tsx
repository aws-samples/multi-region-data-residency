import { Amplify } from 'aws-amplify';

import { Alert, Authenticator, Button, Heading, SelectField, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import awsExports from './aws-exports';
import { useEffect, useState } from 'react';

// TODO: Globalize country to region mapping (e.g. via CDK)
let countryToRegion : {[key: string]: string};

countryToRegion = {
  'Singapore': 'ap-southeast-1', 
  'Australia': 'ap-southeast-2',
  'United Kingdom': 'eu-west-1',
  'United States': 'us-east-2',
};

const getCountryFromRegion = (region: string) : string => {
  // Find the country (key) based on the value of countryToRegion
  for (let country in countryToRegion) {
    if (countryToRegion[country] === region) {
      return country;
    }
  }
  return '';
}

export default function App() {
  const [region, setRegion] = useState('');
  const [stackCountry, setStackCountry] = useState('');
  const [country, setCountry] = useState('');

  // Configure runtime Config to integrate with CDK
  // Source: https://dev.to/aws-builders/aws-cdk-and-amplify-runtime-config-1md2
  Amplify.configure(awsExports);
  const fetchConfig = () => { 
    fetch('/config.json')
    .then((response) => response.status === 200 && response.json())
    .then((context) => {
      const { region, userPoolId, userPoolClientId } = context;
      const runtimeConfig = {
        "aws_project_region": region,
        "aws_cognito_region": region,
        "aws_user_pools_id": userPoolId,
        "aws_user_pools_web_client_id": userPoolClientId,
      }
      const mergedConfig = { ...awsExports, ...runtimeConfig  };
      const stackCountry = getCountryFromRegion(region);
      setRegion(region);
      setStackCountry(stackCountry);
      setCountry(stackCountry);
      Amplify.configure(mergedConfig);
    })
    .catch((e) => console.log('Cannot fetch config.json'));
  }
  useEffect(fetchConfig, []);

  const stackCountryEmoji = 
    stackCountry === 'Australia' ? 
    '🇦🇺' : stackCountry === 'United Kingdom' ? 
    '🇬🇧' : stackCountry === 'United States' ? 
    '🇺🇸' : stackCountry === 'Singapore' ? 
    '🇸🇬' : '';

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRegion = e.target.value;
    const stackCountry = getCountryFromRegion(newRegion);
    setRegion(newRegion);
    setStackCountry(stackCountry);
    setCountry(stackCountry);
  }

  const CountryWarning = (props: { country: string, stackCountry: string }) => {
    const { country, stackCountry } = props;
    if ( country !== stackCountry )
      return(
        <>
          <Alert variation="warning">
            You are signing up to our {stackCountry} website. Please select <b>{stackCountry}</b> to continue or sign up separately on our {country} website.
          </Alert>
        </>
      );
    else
      return <></>
  }

  const SignUpFormFields = {
    FormFields() {
      const { validationErrors } = useAuthenticator();

      const handleSelectCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCountry(e.target.value);
      }
      const selectCountryHasError = !!validationErrors.country;
      const selectCountryErrorMessage = validationErrors.country as string;

      return (
        <>
          {/* Re-use default `Authenticator.SignUp.FormFields` */}
          <Authenticator.SignUp.FormFields />
  
          {/* Append with Country field  */}
          <SelectField
            value={country}
            onChange={handleSelectCountryChange}
            errorMessage={selectCountryErrorMessage}
            hasError={selectCountryHasError}
            name="custom:country"
            label="Country"
          >
            <option>Australia</option>
            <option>United Kingdom</option>
            <option>United States</option>
            <option>Singapore</option>
          </SelectField>

          <CountryWarning country={country} stackCountry={stackCountry} />
        </>
      );
    },
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      
      <div style={{ padding: '25px 0', marginBottom: '40px',  textAlign: 'center' }}>
        <Heading level={1} style={{ marginBottom: '10px' }}>Multi-Region Demo </Heading>
        <Heading level={4}>{stackCountry} {stackCountryEmoji}</Heading>
        <div style={{ marginTop: '8px', fontSize: '14px', color: 'gray' }}>AWS Region: {region}</div>
      </div>

      <Authenticator
        loginMechanisms={['email']}
        components={{
          SignUp: SignUpFormFields
        }}
      >
        {({ signOut, user }) => (
          <main style={{ textAlign: 'center' }}>
            <div>
              <Heading level={2}>Hello <b>{user?.username}</b></Heading>
            </div>
            <div style={{ margin: '25px 0' }}>
              {user?.attributes?.['custom:country']}
            </div>
            <div>
              <Button onClick={signOut}>Sign out</Button>
            </div>
          </main>
        )}
      </Authenticator>
    </div>
  );
}