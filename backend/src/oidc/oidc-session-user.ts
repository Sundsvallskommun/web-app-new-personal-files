import { OIDC_USERNAME_CLAIM } from '@config';
import { authorizeGroups } from '@services/authorization.service';
import { createSessionUser } from '@services/session-user.service';

type OidcLoginFailure = 'OIDC_MISSING_ATTRIBUTES' | 'OIDC_MISSING_GROUP' | 'OIDC_TOKEN_EXCHANGE_FAILED';

export class OidcLoginError extends Error {
  constructor(public readonly name: OidcLoginFailure) {
    super(name);
  }
}

const nonEmptyStringClaim = (claim: unknown) => (typeof claim === 'string' && claim.trim() !== '' ? claim : undefined);

const firstNonEmptyNameClaim = (claim: unknown) => [claim].flat().map(nonEmptyStringClaim).find(Boolean);

const groupsClaimAsCsv = (claim: unknown) =>
  Array.isArray(claim)
    ? claim.filter(group => typeof group === 'string').join(',')
    : (nonEmptyStringClaim(claim) ?? '');

export const createSessionUserFromOidcClaims = async (claims: Record<string, unknown>) => {
  const givenName = firstNonEmptyNameClaim(claims.given_name) ?? firstNonEmptyNameClaim(claims.givenName);
  const surname = firstNonEmptyNameClaim(claims.family_name) ?? firstNonEmptyNameClaim(claims.sn);
  const username = nonEmptyStringClaim(claims[OIDC_USERNAME_CLAIM]) ?? nonEmptyStringClaim(claims.username);
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
