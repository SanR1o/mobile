import React from "react";
import { 
    View,
    Text,
    ActivityIndicator
} from "react-native";
import { globalStyles, colors } from "../styles"

const LoadingScreen: React.FC = () => {
    return (
        <View style={globalStyles.loadingScreenContainer}>
            <View style={globalStyles.loadingContent}>
                <Text style={globalStyles.appLogo}>Logo</Text>
                <Text style={globalStyles.appName}>Mi App</Text>
                <Text style={globalStyles.appSubtitle}>Sistema de gestion</Text>

                <View style={globalStyles.loadingIndicatorText}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={globalStyles.loadingText}>Cargando...</Text>

                </View>
            </View>
        </View>
    );
};

export default LoadingScreen;
