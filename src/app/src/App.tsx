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

const getRegionFromCountry = (country: string) : string => {
  // Find the region (value) based on the key of countryToRegion
  return countryToRegion[country];
}

export default function App() {

  // Get current host URL
  let host = window.location.host;
  const hostSplit = host.split('.');

  // Get site domain based on host, strip sub-domain
  const siteDomain = hostSplit.slice(1, hostSplit.length).join('.');

  // React states for hooks
  const [region, setRegion] = useState('');
  const [stackCountry, setStackCountry] = useState('');
  const [country, setCountry] = useState('');
  const [apiUrl, setApiUrl] = useState(`https://app.${siteDomain}`);

  // Configure runtime Config to integrate with CDK
  // Source: https://dev.to/aws-builders/aws-cdk-and-amplify-runtime-config-1md2
  Amplify.configure(awsExports);

  const fetchConfig = (apiUrl: string) => { 
    fetch(`${apiUrl}/config`)
    .then((response) => response.status === 200 && response.json())
    .then((context) => {
      const { region, cognitoUserPoolId, cognitoUserPoolClientId } = context;
      const runtimeConfig = {
        "aws_project_region": region,
        "aws_cognito_region": region,
        "aws_user_pools_id": cognitoUserPoolId,
        "aws_user_pools_web_client_id": cognitoUserPoolClientId,
      }
      const mergedConfig = { ...awsExports, ...runtimeConfig  };
      const setCountryBasedOnRegion = getCountryFromRegion(region);
      setRegion(region);
      setStackCountry(setCountryBasedOnRegion);
      setCountry(setCountryBasedOnRegion);
      Amplify.configure(mergedConfig);
    })
    .catch((e) => console.log('Cannot fetch config.json'));
  }

  useEffect(() => fetchConfig(apiUrl), [apiUrl]);

  // Function to switch API region
  const switchRegion = (region: string = '', country: string = '') => {
    if ( region === '' ) {
      setApiUrl(`https://app.${siteDomain}`);
      setRegion(region);
    } else {
      setApiUrl(`https://${region}.${siteDomain}`);
      setRegion(region);
    }

    if ( country ) {
      setCountry(country);
      setStackCountry(country);
    }
  }

  // Fun: Emoji visualiation for country
  // (Thanks to Amazon CodeWhisperer)
  const stackCountryEmoji = 
    stackCountry === 'Australia' ? '🇦🇺' : 
    stackCountry === 'United Kingdom' ? '🇬🇧' : 
    stackCountry === 'United States' ? '🇺🇸' : 
    stackCountry === 'Singapore' ? '🇸🇬' : 
    '';

  const SignUpFormFields = {
    FormFields() {
      const { validationErrors } = useAuthenticator();

      const handleSelectCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        switchRegion(getRegionFromCountry(e.target.value), e.target.value);
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
            <option>United States</option>
          </SelectField>
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
        <div style={{ marginTop: '8px', fontSize: '14px', color: 'gray' }}>API Endpoint: {apiUrl}</div>
        <div style={{ marginTop: '8px', fontSize: '14px', color: 'gray' }}>
          Switch Country: &nbsp;
          <a href="#" onClick={() => switchRegion("")}>Default</a> |&nbsp;
          <a href="#" onClick={() => switchRegion("ap-southeast-2", "Australia")}>Australia</a> |&nbsp;
          <a href="#" onClick={() => switchRegion("us-east-2", "United States")}>United States</a>
        </div>
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