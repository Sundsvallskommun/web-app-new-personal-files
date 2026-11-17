import { authorizeGroups } from '@services/authorization.service';
import { createSessionUser } from '@services/session-user.service';

type OidcLoginFailure = 'OIDC_MISSING_ATTRIBUTES' | 'OIDC_MISSING_GROUP' | 'OIDC_TOKEN_EXCHANGE_FAILED';

export class OidcLoginError extends Error {
  constructor(public readonly name: OidcLoginFailure) {
    super(name);
  }
}

const nonEmptyStringClaim = (claim: unknown) => (typeof claim === 'string' && claim.trim() !== '' ? claim : undefined);

const groupsClaimAsCsv = (claim: unknown) =>
  Array.isArray(claim)
    ? claim.filter(group => typeof group === 'string').join(',')
    : (nonEmptyStringClaim(claim) ?? '');

export const createSessionUserFromOidcClaims = async (claims: Record<string, unknown>) => {
  const givenName = nonEmptyStringClaim(claims.given_name) ?? nonEmptyStringClaim(claims.givenName);
  const surname = nonEmptyStringClaim(claims.family_name) ?? nonEmptyStringClaim(claims.sn);
  const username = nonEmptyStringClaim(claims.preferred_username) ?? nonEmptyStringClaim(claims.username);
  const groups = groupsClaimAsCsv(claims.groups) || groupsClaimAsCsv(claims.roles);

  if (!givenName || !surname || !username) {
    throw new OidcLoginError('OIDC_MISSING_ATTRIBUTES');
  }

  if (!authorizeGroups(groups)) {
    throw new OidcLoginError('OIDC_MISSING_GROUP');
  }

  return createSessionUser({
    givenName,
    surname,
    username,
    groups,
    email: nonEmptyStringClaim(claims.email),
    citizenIdentifier: nonEmptyStringClaim(claims.citizenIdentifier),
  });
};
