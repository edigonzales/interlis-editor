import { signAsync } from '@electron/osx-sign';

export default async function signMacOSAdHoc(options) {
    if (process.platform !== 'darwin') {
        throw new Error('The macOS ad-hoc signer can only run on macOS.');
    }

    await signAsync({
        ...options,
        identity: '-',
        identityValidation: false,
        preAutoEntitlements: false,
    });
}
