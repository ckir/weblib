declare module 'weblib' {
    namespace Common {
        namespace Markets {
            namespace Nasdaq {
                interface ApiNasdaq {
                    ApiNasdaq: any; // You might want to replace 'any' with a more specific type if known
                }
            }
        }
    }

    const WebLib: {
        Common: {
            Markets: {
                Nasdaq: {
                    ApiNasdaq: ApiNasdaq;
                };
            };
        };
    };

    export default WebLib;
}