export type ContractVersion = {
  major: number;
};

export function currentContractVersion(): ContractVersion {
  return { major: 1 };
}
