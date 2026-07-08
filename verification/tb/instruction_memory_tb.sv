`timescale 1ns / 1ps

//////////////////////////////////////////////////////////////////////////////////
// Project : QuantumRISC
// Module  : Instruction Memory Testbench
// Author  : Chandu Vemula
//////////////////////////////////////////////////////////////////////////////////

module instruction_memory_tb;

    logic [31:0] address;
    logic [31:0] instruction;

    // Device Under Test
    instruction_memory dut (
        .address(address),
        .instruction(instruction)
    );

    initial begin

        $display("======================================");
        $display(" QuantumRISC Instruction Memory Test");
        $display("======================================");

        // Address 0
        address = 32'h00000000;
        #10;
        if (instruction == 32'h00A00093)
            $display("[PASS] Address 0");
        else
            $display("[FAIL] Address 0");

        // Address 4
        address = 32'h00000004;
        #10;
        if (instruction == 32'h01400113)
            $display("[PASS] Address 4");
        else
            $display("[FAIL] Address 4");

        // Address 8
        address = 32'h00000008;
        #10;
        if (instruction == 32'h002081B3)
            $display("[PASS] Address 8");
        else
            $display("[FAIL] Address 8");

        // Address 12
        address = 32'h0000000C;
        #10;
        if (instruction == 32'h40118233)
            $display("[PASS] Address 12");
        else
            $display("[FAIL] Address 12");

        $display("======================================");
        $display(" Instruction Memory Test Completed");
        $display("======================================");

        $finish;

    end

endmodule