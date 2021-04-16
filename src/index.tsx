import { ApplicationInsights, IConfig, SeverityLevel } from '@microsoft/applicationinsights-web';
import * as React from 'react';


/**
 * Re-Exporting the SeverityLevel and IConfig
 */
export { SeverityLevel, IConfig }

/**
 * type for the logException Function
 */
export type LogExceptionFunctionType = (error: Error, severityLevel?: SeverityLevel, properties?: any) => void

/**
 * Queue to hold Exceptions which occured before the Initialization of the App Insights
 */
const pendingExceptionQueue: { error: Error, severityLevel?: SeverityLevel, properties?: any }[] = []

/**
 * Boolean flag specifying whether the App Insight Instance is Loaded
 */
let isAppInsightLoaded = false

/**
 * variable for context
 */
const ExceptionLoggerContext = React.createContext<LogExceptionFunctionType>(() => { })

/**
 * Interface with available function logException of type LogExceptionFunctionType to log exceptions caught manually
 */
export interface IWithExceptionLogger {
    logException: LogExceptionFunctionType
}

/**
 * High Order Component to wrap the passed parameter component with additional logics for the initialization of the App Insight in the
 * application 
 * @param Component React Functional Component or React Class Component
 * @param connectionString connectionString as obtained throught the Azure App Insights Dashboard
 * @param configurations additional configurations to be passed as per the requirements. For more info on the available configurations
 * please refer to the official docs. If not supplied then all default configurations as per the Azure Insights documentation are tracked
 * @returns JSX.Element
 */

export function withExceptionLogger<P>(Component: React.ComponentType<P>, connectionString: string, configurations?: IConfig) {

    const compentWithWrappedAppInsight = (props: P & IWithExceptionLogger) => {

        const [appInsightsInstance, setAppInsightsInstance] = React.useState<ApplicationInsights>()

        React.useEffect(() => {

            let newAppInsightsInstance = new ApplicationInsights({
                config: {
                    connectionString: connectionString,
                    ...configurations
                }
            })


            setAppInsightsInstance(newAppInsightsInstance)
            return () => {
                appInsightsInstance?.onunloadFlush()
            }


        }, [])

        React.useEffect(() => {
            if (appInsightsInstance) {
                appInsightsInstance.loadAppInsights()

                isAppInsightLoaded = true

                while (pendingExceptionQueue.length > 0) {
                    const exception = pendingExceptionQueue.shift()
                    if (!exception) {
                        logException(new Error('Pending Queue Containing Undefined Exception'))
                    } else {
                        logException(exception.error, exception.severityLevel, {
                            ...exception.properties,
                            isCaughtInQueue: 'Yes'
                        })
                    }
                }
            }
        }, [appInsightsInstance])

        /**
         * Log exceptions that are manually caught
         * @param message The new Error message to be logged
         * @param severityLevel Severity level of the exception
         * @param properties additional properties to log
         */
        const logException: LogExceptionFunctionType = (error: Error, severityLevel: SeverityLevel = SeverityLevel.Information, properties?: any) => {
            if (!appInsightsInstance) {
                pendingExceptionQueue.push({ error, severityLevel, properties })
                return
            }
            appInsightsInstance.trackException({ exception: error, properties: properties, severityLevel: severityLevel })
        }

        return (
            <ExceptionLoggerContext.Provider value={logException} >
                <Component {...props} logException={logException} />
            </ExceptionLoggerContext.Provider>
        )
    }

    return compentWithWrappedAppInsight
}

/**
 * Provides the consumer so as to get the logException function from the context
 * 
 * @param props 
 * @returns 
 */
export function ExceptionLoggerConsumer(props: any) {

    const logException = React.useContext(ExceptionLoggerContext)
    if (!logException) {
        pendingExceptionQueue.push({ error: new Error('Consumer Called before the Initialization of the App Insight') })
        return <></>
    }
    return (
        <ExceptionLoggerContext.Consumer>
            {props.children}
        </ExceptionLoggerContext.Consumer>
    )
}


/**
 * Hook to get access to the logException function from the Context
 * @returns a function to log the custom error message
 */
export function useExceptionLogger() {
    const logException: LogExceptionFunctionType = React.useContext(ExceptionLoggerContext)
    if (!logException) {
        return (error: Error, severityLevel?: SeverityLevel, properties?: any) => pendingExceptionQueue.push({ error, severityLevel, properties })
    }
    return logException
}

/**
 * Global Listener for Error on the current window. If the error occurs before the App Insights Initialization then the error 
 * object is passed to the queue
 * 
 * @param message 
 * @param source 
 * @param lineno 
 * @param colno 
 * @param error 
 */
window.onerror = (message, source, lineno, colno, error) => {
    if (!isAppInsightLoaded) {
        pendingExceptionQueue.push({ error: error!, severityLevel: SeverityLevel.Critical })
    }
}