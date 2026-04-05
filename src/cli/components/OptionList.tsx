import { Box, Text, useInput } from "ink";
import React from "react"; // biome-ignore lint/style/useImportType: required for JSX runtime
import { useState } from "react";
import type { Option } from "../../types/index.js";

interface OptionListProps {
	options: Option[];
	type: "single" | "multi";
	value: string | string[] | null;
	onChange: (value: string | string[]) => void;
	onBack?: () => void;
	onContinue?: () => void;
	maxWidth?: number;
}

export const OptionList: React.FC<OptionListProps> = ({
	options,
	type,
	value,
	onChange,
	onBack,
	onContinue,
	maxWidth = 80,
}) => {
	const [selectedIndex, setSelectedIndex] = useState(0);

	const isSelected = (optValue: string) => {
		if (type === "single") return value === optValue;
		return Array.isArray(value) && value.includes(optValue);
	};

	const toggleOption = (optValue: string) => {
		if (type === "single") {
			onChange(optValue);
		} else {
			const current = Array.isArray(value) ? value : [];
			const newValue = current.includes(optValue)
				? current.filter((v) => v !== optValue)
				: [...current, optValue];
			onChange(newValue);
		}
	};

	useInput((input, key) => {
		if (key.upArrow) {
			setSelectedIndex((prev) => Math.max(0, prev - 1));
		} else if (key.downArrow) {
			setSelectedIndex((prev) => Math.min(options.length - 1, prev + 1));
		} else if (input === " ") {
			// Spacebar to select/toggle
			toggleOption(options[selectedIndex].value);
		} else if (key.return && onContinue) {
			// Enter to continue
			onContinue();
		} else if (key.escape && onBack) {
			onBack();
		}
	});

	return (
		<Box flexDirection="column" width={maxWidth}>
			{options.map((opt, index) => {
				const selected = isSelected(opt.value);
				const highlighted = index === selectedIndex;

				return (
					<Box key={opt.value} marginY={0} flexDirection="column">
						<Box>
							{/* Selection indicator */}
							{highlighted ? (
								<Text color="cyan">{"❯ "}</Text>
							) : (
								<Text>{"  "}</Text>
							)}
							
							{/* Checkbox/Radio indicator */}
							{type === "multi" ? (
								selected ? (
									<Text color="green">[✓] </Text>
								) : (
									<Text color="gray">[ ] </Text>
								)
							) : selected ? (
								<Text color="green">(●) </Text>
							) : (
								<Text color="gray">(○) </Text>
							)}
							
							{/* Label */}
							{highlighted ? (
								<Text color="cyan" bold>
									{opt.label}
								</Text>
							) : selected ? (
								<Text color="green">{opt.label}</Text>
							) : (
								<Text>{opt.label}</Text>
							)}
							
							{/* Badge */}
							{opt.badge && (
								<Text color={getBadgeColor(opt.badge)}>
									{" "}
									{formatBadge(opt.badge)}
								</Text>
							)}
						</Box>
						
						{/* Description on next line if exists */}
						{opt.description && (
							<Box marginLeft={4}>
								<Text dimColor wrap="end">
									{opt.description}
								</Text>
							</Box>
						)}
					</Box>
				);
			})}
		</Box>
	);
};

function getBadgeColor(badge: string): string {
	switch (badge) {
		case "recommended":
			return "green";
		case "popular":
			return "blue";
		case "experimental":
			return "yellow";
		case "legacy":
			return "gray";
		case "new":
			return "magenta";
		default:
			return "white";
	}
}

function formatBadge(badge: string): string {
	switch (badge) {
		case "recommended":
			return "★ Recommended";
		case "popular":
			return "🔥 Popular";
		case "experimental":
			return "🧪 Experimental";
		case "legacy":
			return "⚠ Legacy";
		case "new":
			return "✨ New";
		default:
			return badge;
	}
}

export default OptionList;
